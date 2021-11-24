import { STS } from "aws-sdk";
import createError, { HttpError } from "http-errors";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// http-errors returns a string instead of a JSON object by default, if you simpy pass a string
export const createHttpError = (statusCode: number, obj: Record<string, any>): HttpError => {
  const recordString: string = JSON.stringify(obj);
  return new createError[statusCode](recordString);
};

export const getValueOrDefault = (value: string, defaultValue: string): string => value || defaultValue;

const { argv } = yargs(hideBin(process.argv));

interface ArgvParams {
  flag: string;
  defaultValue?: string;
}

export const getArgumentValuesOrDefault = ({ flag, defaultValue = "" }: ArgvParams): string => {
  const value = argv[flag] as string;
  return value || defaultValue;
};

export const getAWSAccountId = async (): Promise<string> => {
  if (process.env.IS_OFFLINE) return "123456789012";

  try {
    const sts = new STS();
    const result = await sts.getCallerIdentity().promise();
    if (typeof result.Account !== "string") throw new Error("No account!");
    return result.Account;
  } catch (e) {
    return "*";
  }
};
