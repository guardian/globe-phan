
export type Either<Left, Right> =
  | { value: Left; error: undefined }
  | { error: Right; value: undefined };
