"use strict";

/* Original offline demonstration content. No Python interpreter, network,
   tracking, persistence, third-party library, eval or user input. */
const CHAPTERS = Object.freeze({
  origins: {
    file: "01_origins.py",
    caption: "A single line changes an empty screen into something meaningful.",
    code: 'print("Hello, world!")',
    output: "Hello, world!"
  },
  collections: {
    file: "02_collections.py",
    caption: "A list gathers separate pieces into an intentional sequence.",
    code: 'colors = ["cobalt", "amber", "ivory"]\nfor color in colors:\n    print(color.title())',
    output: "Cobalt\nAmber\nIvory"
  },
  decisions: {
    file: "03_decisions.py",
    caption: "Conditional logic gives a program a clear way to choose.",
    code: 'energy = 72\nif energy >= 60:\n    print("Ready to begin")\nelse:\n    print("Pause and prepare")',
    output: "Ready to begin"
  },
  functions: {
    file: "04_functions.py",
    caption: "A function names an idea so it can be called again.",
    code: 'def orbit(name):\n    return "Welcome to " + name\n\nprint(orbit("Python"))',
    output: "Welcome to Python"
  }
});

const chapterButtons = [...document.querySelectorAll("button[data-chapter]")];
const fileLabel = document.getElementById("code-file");
const caption = document.getElementById("chapter-caption");
const codeContent = document.getElementById("code-content");
const outputContent = document.getElementById("output-content");
const progress = document.getElementById("progress");
const feedback = document.getElementById("feedback");
const runButton = document.getElementById("run-button");
const copyButton = document.getElementById("copy-button");

let currentChapter = "origins";
const visited = new Set([currentChapter]);
const placeholder = "Select “Reveal illustrative output” to see the example result.";

function selectChapter(id) {
  if (!Object.hasOwn(CHAPTERS, id)) return;
  currentChapter = id;
  const selected = CHAPTERS[id];

  for (const button of chapterButtons) {
    const active = button.dataset.chapter === id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }

  fileLabel.textContent = selected.file;
  caption.textContent = selected.caption;
  codeContent.textContent = selected.code;
  outputContent.textContent = placeholder;
  visited.add(id);
  progress.textContent = String(visited.size).padStart(2, "0") + " / 04 EXPLORED";
  feedback.textContent = "Chapter selected. The example has not been executed.";
}

for (const button of chapterButtons) {
  button.addEventListener("click", () => selectChapter(button.dataset.chapter));
}

runButton.addEventListener("click", () => {
  /* Illustrative output only, not runtime execution. */
  outputContent.textContent = CHAPTERS[currentChapter].output;
  feedback.textContent = "Illustrative result revealed. Run the Python locally to verify.";
});

copyButton.addEventListener("click", async () => {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    feedback.textContent = "Copy is unavailable here. You can select the code manually.";
    return;
  }
  try {
    await navigator.clipboard.writeText(CHAPTERS[currentChapter].code);
    feedback.textContent = "Example code copied.";
  } catch {
    feedback.textContent = "Copy permission unavailable. You can select the code manually.";
  }
});
