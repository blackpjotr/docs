/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DSP_VERSION = '2.0.0-alpha.6';

// License check helper command
const LICENSE_CHECK = {
  shell: 'mvn -C -P dspublisher-license-check',
  phases: [
    {
      text: 'Checking license',
      readySignal: 'BUILD SUCCESS',
      doneText: 'License check passed',
      weight: 10,
    },
  ],
};

// Makes sure the necessary npm dependencies are installed
const concurrentlyInstalled = fs.existsSync(
  path.resolve(__dirname, '..', 'node_modules', 'concurrently')
);
const dependenciesInstalled = concurrentlyInstalled;
const DEPENDENCIES = !dependenciesInstalled
  ? [
      {
        shell: 'mvn vaadin:prepare-frontend vaadin:build-frontend',
        phases: [
          {
            text: 'Installing dependencies',
            readySignal: 'BUILD SUCCESS',
            doneText: 'Dependencies installed',
            weight: 25,
          },
        ],
      },
    ]
  : [];

const SCRIPTS = {
  clean: {
    name: 'DSP Clean',
    commands: [
      {
        shell: `npx @vaadin/dspublisher@${DSP_VERSION} --clean && mvn -C clean`,
        phases: [
          {
            text: 'Cleaning up caches',
            readySignal: 'BUILD SUCCESS',
            doneText: 'Ready. Caches cleaned up',
            weight: 5,
          },
        ],
      },
    ],
  },
  develop: {
    name: 'DSP Start',
    commands: [
      LICENSE_CHECK,
      ...DEPENDENCIES,
      // Starts docs-app and docs server (concurrently)
      {
        shell: `npx concurrently --kill-others --raw "npx @vaadin/dspublisher@${DSP_VERSION} --develop" "mvn -C"`,
        phases: [
          {
            text: 'Initializing',
            readySignal: 'success building schema',
            weight: 30,
          },
          {
            text: 'Creating pages',
            readySignal: 'success createPages',
            weight: 15,
          },
          {
            text: 'Building development bundle',
            readySignal: 'You can now view',
            doneText: 'Ready. Open http://localhost:8000 in the browser.',
            weight: 95,
            lastPhase: true,
          },
        ],
      },
    ],
  },
  build: {
    name: 'DSP Build',
    commands: [
      LICENSE_CHECK,
      ...DEPENDENCIES,
      {
        func: () => {
          fs.rm(path.resolve(__dirname, 'out'), { recursive: true }, () => {});
        },
        phases: [
          {
            text: 'Removing old build',
            weight: 1,
          },
        ],
      },
      {
        shell: 'mvn -C clean package -DskipTests -Pproduction',
        phases: [
          {
            text: 'Building a deployable jar',
            readySignal: 'BUILD SUCCESS',
            weight: 40,
          },
        ],
      },
      {
        shell: `npx @vaadin/dspublisher@${DSP_VERSION} --build`,
        phases: [
          {
            text: 'Building static pages',
            readySignal: 'success createPages',
            weight: 35,
          },
          {
            text: 'Building production JavaScript and CSS bundles',
            readySignal: 'success Building production JavaScript and CSS bundles',
            weight: 180,
          },
          {
            text: 'Generating image thumbnails',
            readySignal: 'Done building',
            weight: 60,
          },
        ],
      },
      {
        func: () => {
          // Copy the jar file from ../target/*.jar to ../dspublisher/out/docs.jar
          const jarFile = fs
            .readdirSync(path.resolve(__dirname, '..', 'target'))
            .find((fn) => fn.endsWith('.jar'));

          fs.copyFile(
            path.resolve(__dirname, '..', 'target', jarFile),
            path.resolve(__dirname, 'out', 'docs.jar'),
            (err) => {
              if (err) throw err;
            }
          );
        },
        phases: [
          {
            text: 'Copying jar to output',
            doneText: 'Ready. The build artifacts are in dspublisher/out',
            weight: 5,
            lastPhase: true,
          },
        ],
      },
    ],
  },
};

let activeScript;
if (process.argv.includes('--develop')) {
  activeScript = SCRIPTS.develop;
} else if (process.argv.includes('--clean')) {
  activeScript = SCRIPTS.clean;
} else if (process.argv.includes('--build')) {
  activeScript = SCRIPTS.build;
}

const totalWeight = activeScript.commands.reduce(
  (acc, command) => acc + command.phases.reduce((acc, p) => acc + p.weight, 0),
  0
);

const progressState = {
  name: activeScript.name,
  phase: '',
  spinner: '',
  progress: 0,
};

/**
 * Renders the progress bar.
 * Can't use a library for this because initially no dependencies are installed.
 */
function renderProgress(state) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);

  const progressBarWidth = 30;
  const progressBar = `[${'='.repeat(
    Math.floor((state.progress / totalWeight) * progressBarWidth)
  )}${' '.repeat(
    progressBarWidth - Math.floor((state.progress / totalWeight) * progressBarWidth)
  )}]`;

  process.stdout.write(`${state.name} ${progressBar} ${state.phase}${state.spinner}`);
}

// Interval for rendering the "spinner"
const spinnerInterval = setInterval(() => {
  progressState.spinner = progressState.spinner.length === 3 ? '' : progressState.spinner + '.';
  renderProgress(progressState);
}, 500);

function finish() {
  // Stop the spinner
  clearInterval(spinnerInterval);
  progressState.spinner = '';

  // Make sure the progress bar shows 100%
  progressState.progress = totalWeight;

  // Render doneText of the last phase of the last command
  const lastCommand = activeScript.commands[activeScript.commands.length - 1];
  const lastPhase = lastCommand.phases[lastCommand.phases.length - 1];
  progressState.phase = lastPhase.doneText;

  renderProgress(progressState);
}

// Run each command sequentially
const runCommand = (commands, index) => {
  const command = commands[index];

  // Render the text from the first phase of the current command
  progressState.phase = command.phases[0].text;
  renderProgress(progressState);

  if (command.shell) {
    const process = exec(command.shell, (error) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }

      if (index < commands.length - 1) {
        // The current command was finished, run the next one
        runCommand(commands, index + 1);
      } else {
        // All commands were run, finish
        finish();
      }
    });

    // TODO: --verbose option
    process.stdout.on('data', (data) => {
      const phases = command.phases;

      // Find if the output includes the ready signal for one of the phases.
      const phase = phases.find((p) => data.includes(p.readySignal));

      if (phase && !phase.done) {
        // A phase was found and it wasn't marked as done yet

        if (phase.lastPhase) {
          // This is the last phase of the script
          finish();
        } else {
          // Update the progress
          progressState.progress += phase.weight;

          const nextPhase = phases[phases.indexOf(phase) + 1];
          if (nextPhase) {
            // If the next phase exists, render its text
            progressState.phase = nextPhase.text;
          }

          renderProgress(progressState);
        }

        phase.done = true;
      }
    });
  } else if (command.func) {
    command.func();

    if (index < commands.length - 1) {
      // The current command was finished, run the next one
      runCommand(commands, index + 1);
    } else {
      // All commands were run, finish
      finish();
    }
  }
};

// Before running the commands, make sure DSP is installed
execSync(`npx @vaadin/dspublisher@${DSP_VERSION}`, { stdio: 'inherit' });

runCommand(activeScript.commands, 0);
