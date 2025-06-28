import loader from "@monaco-editor/loader";

import { binaryToJson, jsonToBinary } from "./lib/gltf-io.js";
import { saveBlob } from "./lib/saveBlob.js";

const URL =
  "https://rawcdn.githack.com/mrdoob/three.js/e241101b5f88102ce31ce87ed5f3d8ea2fbad057/examples/models/gltf/Stork.glb";

/**
 * DOM ELEMENTS
 */
const instructions = document.querySelector("#instructions");
const loading = document.querySelector("#loading");
const root = document.querySelector("#editor-root");

const state = {
  jsonDoc: null,
  fileName: null,
};

Object.assign(window, { state });

const monacoPromise = loader.init().then((monaco) => {
  const model = monaco.editor.create(document.getElementById("editor-root"), {
    value: "",
    language: "json",
    scrollBeyondLastLine: false,
    theme: "vs-dark",
    automaticLayout: true,
    minimap: {
      enabled: false,
    },
  });
  
  Object.assign(window, { monaco, model });

  return monaco;
});

/**
 * UI Stages
 */
function showInstructions() {
  instructions.style.display = "";
  loading.style.display = "none";
  root.style.display = "none";
}

function showLoading() {
  instructions.style.display = "none";
  loading.style.display = "";
  root.style.display = "none";
}

function showEditorRoot() {
  instructions.style.display = "none";
  loading.style.display = "none";
  root.style.display = "";
}

async function loadGLB(arrayBuffer) {
  const jsonDoc = await binaryToJson(new Uint8Array(arrayBuffer));
  state.jsonDoc = jsonDoc;

  console.log("glTF data exposed on `window.gltf`");
  Object.assign(window, { gltf: jsonDoc });

  await setValue(JSON.stringify(jsonDoc.json, null, 2));
  showEditorRoot();
}

async function loadGLBRemote(url) {
  showLoading();

  const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());

  return loadGLB(arrayBuffer);
}

async function setValue(value) {
  const monaco = await monacoPromise;
  const model = monaco.editor.getModels()[0];
  model.setValue(value);
}

async function getValue() {
  const monaco = await monacoPromise;
  const model = monaco.editor.getModels()[0];
  return model.getValue();
}

/**
 * Event Handlers
 */

function handleDragOver(event) {
  event.preventDefault();
}

async function handleDrop(event) {
  event.preventDefault();
  showLoading();

  const file = event.dataTransfer.files[0];
  state.fileName = file.name;

  const arrayBuffer = await file.arrayBuffer();
  // const glb = new Uint8Array(arrayBuffer)

  loadGLB(arrayBuffer);
}

async function handleSave() {
  if (state.jsonDoc == null) throw new Error("No GLB asset loaded");
  if (state.error) return alert(state.error);

  try {
    const value = await getValue();
    const json = JSON.parse(value);

    const jsonDoc = state.jsonDoc;
    jsonDoc.json = json;

    const binary = await jsonToBinary(jsonDoc);
    const blob = new Blob([binary], { type: "application/octet-stream" });
    saveBlob(blob, state.fileName ?? "model.glb");
  } catch (e) {
    return alert(e);
  }
}

async function handlePaste(event) {
  console.log("handlePaste");
  const pastedText = event.clipboardData.getData("text/plain");
  if (pastedText.startsWith("https://")) {
    const canOverwrite =
      state.gltf == null ||
      window.confirm(
        `Pasted URL:\n\n${pastedText}\n\nContinue loading this model?`
      );
    if (canOverwrite) {
      event.stopPropagation();
      loadGLBRemote(pastedText).catch((e) => {
        showInstructions();
        alert(`Error loading model from URL: ${e}`);
      });
    }
  }
}

/**
 * Event Listeners
 */

document.addEventListener("drop", handleDrop);
document.addEventListener("dragover", handleDragOver);
document.addEventListener("paste", handlePaste);
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault(); // prevent default save dialog
    handleSave();
  }
});

// Load default asset for testing
// loadGLBRemote(URL)
