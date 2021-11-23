/**
 * Generates the path prefix for handlers.
 * @param context `__dirname`
 * @returns
 */
export const handlerPath = (context: string) => {
  return `${context.split(process.cwd())[1].substring(1).replace(/\\/g, "/")}`;
};
