// Browser shim for Node's `stream` module used by some legacy libs.
// We expose minimal placeholders to avoid runtime crashes in client bundles.
export class Readable {}
export class Writable {}
export class Transform {}
export class Duplex {}
export class PassThrough {}

const stream = {
  Readable,
  Writable,
  Transform,
  Duplex,
  PassThrough,
};

export default stream;
