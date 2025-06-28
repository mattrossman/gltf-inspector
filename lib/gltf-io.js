import { WebIO, BufferUtils } from "@gltf-transform/core";

/**
 * @param {Uint8Array} binary
 * @returns {JSONDocument}
 */
export async function binaryToJson(binary) {
  const io = new WebIO();
  const jsonDoc = await io.binaryToJSON(binary);
  return jsonDoc;
}

/**
 * Adapted from:
 * https://github.com/donmccurdy/glTF-Transform/issues/746#issuecomment-1349050844
 * https://github.com/donmccurdy/glTF-Transform/blob/a09aa718d8bbeaed32dcc1556b6d246c5caa5fe1/packages/core/src/io/platform-io.ts#L153-L171
 *
 * @param {JSONDocument} jsonDoc
 * @returns {Uint8Array}
 */
export async function jsonToBinary(jsonDoc) {
  const { json, resources } = jsonDoc;
  const header = new Uint32Array([0x46546c67, 2, 12]);
  const jsonText = JSON.stringify(json);
  const jsonChunkData = BufferUtils.pad(BufferUtils.encodeText(jsonText), 0x20);
  const jsonChunkHeader = BufferUtils.toView(
    new Uint32Array([jsonChunkData.byteLength, 0x4e4f534a])
  );
  const jsonChunk = BufferUtils.concat([jsonChunkHeader, jsonChunkData]);
  header[header.length - 1] += jsonChunk.byteLength;
  const binBuffer = Object.values(resources)[0];
  if (!binBuffer || !binBuffer.byteLength) {
    return BufferUtils.concat([BufferUtils.toView(header), jsonChunk]);
  }
  const binChunkData = BufferUtils.pad(binBuffer, 0x00);
  const binChunkHeader = BufferUtils.toView(
    new Uint32Array([binChunkData.byteLength, 0x004e4942])
  );
  const binChunk = BufferUtils.concat([binChunkHeader, binChunkData]);
  header[header.length - 1] += binChunk.byteLength;
  return BufferUtils.concat([BufferUtils.toView(header), jsonChunk, binChunk]);
}
