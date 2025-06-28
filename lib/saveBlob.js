/**
 * @param {Blob} blob
 * @param {string} fileName
 */
export function saveBlob(blob, fileName) {
  const a = document.createElement("a");
  a.download = fileName;
  a.href = URL.createObjectURL(blob);

  a.click();
}
