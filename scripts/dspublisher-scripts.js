/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { exec, execSync } = require('child_process');

const DSP_VERSION = '2.0.0-alpha.6';

// License check helper command
const LICENSE_CHECK = {
  command: 'mvn -C -P dspublisher-license-check',
  phases: [
    {
      text: 'Checking license',
      readySignal: 'BUILD SUCCESS',
      doneText: 'License check passed',
      weight: 10,
    },
  ],
};

const SCRIPTS = {
  clean: {
    name: 'DSP Clean',
    commands: [
      {
        command: `npx @vaadin/dspublisher@${DSP_VERSION} --clean && mvn -C clean`,
        phases: [
          {
            text: 'Cleaning up caches',
            readySignal: 'BUILD SUCCESS',
            doneText: 'Caches cleaned up',
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
      // Pre-builds the Vaadin frontend and makes sure concurrently (needed in the next phase) is installed
      {
        command: 'mvn vaadin:prepare-frontend vaadin:build-frontend',
        phases: [
          {
            text: 'Installing dependencies',
            readySignal: 'BUILD SUCCESS',
            doneText: 'Dependencies installed',
            weight: 25,
          },
        ],
      },
      // Starts docs-app and docs server (concurrently)
      {
        command: `npx concurrently --kill-others --raw "npx @vaadin/dspublisher@${DSP_VERSION} --develop" "mvn -C"`,
        phases: [
          {
            text: 'Initializing startup',
            readySignal: 'success building schema',
            doneText: 'Creating pages',
            weight: 30,
          },
          {
            readySignal: 'success createPages',
            doneText: 'Building development bundle',
            weight: 15,
          },
          {
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
      {
        command: 'mvn vaadin:prepare-frontend vaadin:build-frontend',
        phases: [
          {
            text: 'Installing dependencies',
            readySignal: 'BUILD SUCCESS',
            doneText: 'Dependencies installed',
            weight: 25,
          },
        ],
      },
      {
        command: 'npx rimraf dspublisher/out',
        phases: [
          {
            text: 'Removing old build',
            weight: 1,
          },
        ],
      },
      {
        command: 'mvn -C clean package -DskipTests -Pproduction',
        phases: [
          {
            text: 'Building a deployable jar',
            weight: 40,
          },
        ],
      },
      {
        command: `npx @vaadin/dspublisher@${DSP_VERSION} --build`,
        phases: [
          {
            text: 'Building static pages',
            readySignal: 'success createPages',
            doneText: 'Building production JavaScript and CSS bundles',
            weight: 35,
          },
          {
            readySignal: 'success Building production JavaScript and CSS bundles',
            doneText: 'Generating image thumbnails',
            weight: 180,
          },
          {
            readySignal: 'Done building',
            doneText: 'Done building static pages',
            weight: 60,
          },
        ],
      },
      {
        command: `cp -r target/*.jar dspublisher/out/docs.jar`,
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

  const progressBarWidth = 30;
  const progressBar = `[${'='.repeat(
    Math.floor((state.progress / totalWeight) * progressBarWidth)
  )}${' '.repeat(
    progressBarWidth - Math.floor((state.progress / totalWeight) * progressBarWidth)
  )}]`;

  process.stdout.write(`${state.name} ${progressBar} ${state.phase}${state.spinner}`);

  process.stdout.cursorTo(0);
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

  const process = exec(command.command, (error) => {
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
    // Find if the output includes the ready signal for one of the phases.
    const phase = command.phases.find((p) => data.includes(p.readySignal));

    if (phase && !phase.done) {
      // A phase was found and it wasn't marked as done yet

      if (phase.lastPhase) {
        // This is the last phase of the script
        finish();
      } else {
        if (phase.doneText) {
          // If the phase has a done text, have it printed
          progressState.phase = phase.doneText;
        }

        // Update the progress
        progressState.progress += phase.weight;

        renderProgress(progressState);
      }

      phase.done = true;
    }
  });
};

// Before running the commands, make sure DSP is installed
execSync(`npx @vaadin/dspublisher@${DSP_VERSION}`, { stdio: 'inherit' });

runCommand(activeScript.commands, 0);
