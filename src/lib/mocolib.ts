import * as fs from 'fs';
import * as path from 'path';
import { Contract } from './contract';
import {
  jswiremock,
  stubFor,
  clearStubs,
  suppressConsole,
  get,
  post,
  put,
  delete as _delete,
  patch,
  options,
  urlEqualTo,
  a_response,
} from 'node-jswiremock';

const methods = {
  _POST: post,
  _PUT: put,
  _PATCH: patch,
  _DELETE: _delete,
  _OPTIONS: options,
};

const walk = (
  dir: string,
  resolveFile: (data: Promise<Contract[]> | null, err?: Error) => void,
) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, async (err, files) => {
      if (err) {
        resolveFile(null, err);
        return reject();
      }
      try {
        await Promise.all(
          files.map(file => {
            return new Promise((_resolve, _reject) => {
              fs.stat(path.resolve(dir, file), async (_err, stat) => {
                if (_err) {
                  resolveFile(null, _err);
                  return _reject();
                }
                if (stat && stat.isDirectory()) {
                  await walk(path.resolve(dir, file), resolveFile);
                } else {
                  if (path.extname(file) === '.json') {
                    resolveFile(parseFile(path.resolve(dir, file)));
                  }
                }
                _resolve();
              });
            });
          }),
        );
      } catch (error) {
        return reject();
      }
      resolve();
    });
  });
};

const parseFile = (filePath: string): Promise<Contract[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        let rawContracts: any[];
        try {
          rawContracts = JSON.parse(data);
          const contracts = [];
          rawContracts instanceof Array &&
            rawContracts.forEach(rawContract => {
              contracts.push(
                new Contract(
                  rawContract.description,
                  rawContract.request,
                  rawContract.response,
                ),
              );
            });
          resolve(contracts);
        } catch (error) {
          reject(error);
        }
      }
    });
  });
};

const buildContractTreeFromDirectory = async (dirpath: string) => {
  const rootDir = path.join(process.cwd(), dirpath);
  const results: Promise<Contract[]>[] = [];
  await walk(rootDir, (data, err) => {
    if (!err && data) {
      results.push(data);
    }
  });
  let contractGroupList: Contract[][];
  const _contractMap = new Map<string, Contract>();
  try {
    contractGroupList = await Promise.all(results);
  } catch (error) {
    console.error(error);
    return _contractMap;
  }
  contractGroupList.forEach(contractGroup => {
    contractGroup.forEach(contract => {
      _contractMap.set(contract.getDescription(), contract);
    });
  });
  return _contractMap;
};

const componseQueryString = (uri: string, params: object) => {
  if (!params) {
    return uri;
  }
  const esc = encodeURIComponent;
  return (
    uri +
    '?' +
    Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&')
  );
};

const preprocessQueryParams = (params: object) => {
  if (!params) {
    return {};
  }
  const returnParams = {};
  for (const key of Object.keys(params)) {
    if (typeof params[key] !== 'string') {
      returnParams[key] = params[key] + '';
    } else {
      returnParams[key] = params[key];
    }
  }
  return returnParams;
};

export interface MocoServerOptions {
  defaultPort?: number;
  tagPortMapping?: {
    [key: string]: number;
  };
}

export class MocoServer {
  private contractMap: Map<string, Contract> | null;

  private contractPath: string;

  private stubServerPort: number;

  private stubServerOptions: MocoServerOptions;

  private stubServerMap: Map<string, jswiremock> = new Map();

  private readonly DEFAULT_TAG: string = 'DEFAULT';

  constructor(contractPath: string, _options: number | MocoServerOptions) {
    this.contractPath = contractPath;
    if (typeof _options === 'number') {
      this.stubServerPort = _options;
    } else {
      this.stubServerPort = _options.defaultPort;
      this.stubServerOptions = _options;
      if (!this.stubServerPort && !this.stubServerOptions) {
        throw new Error('Either port or tagPortMapping must be provided');
      }
    }
  }

  public buildContractMap = async () => {
    this.contractMap = await buildContractTreeFromDirectory(this.contractPath);
  };

  public cleanContractMap = () => {
    this.contractMap && this.contractMap.clear();
  };

  public start = async () => {
    await this.buildContractMap();
    if (this.stubServerOptions) {
      const { tagPortMapping } = this.stubServerOptions;
      if (this.stubServerPort) {
        this.stubServerMap.set(
          this.DEFAULT_TAG,
          new jswiremock(this.stubServerPort),
        );
      }
      if (!tagPortMapping) {
        return;
      }
      for (const tag of Object.keys(tagPortMapping)) {
        this.stubServerMap.set(tag, new jswiremock(tagPortMapping[tag]));
      }
    } else {
      this.stubServerMap.set(
        this.DEFAULT_TAG,
        new jswiremock(this.stubServerPort),
      );
    }
  };

  public stop = () => {
    this.stubServerMap.forEach((server: jswiremock) => {
      server.stopJSWireMock();
    });
  };

  public getContratMap = () => {
    return this.contractMap;
  };

  public suppressConsole = () => {
    return suppressConsole();
  };

  public clearStubs = (tag: string) => {
    const stubServer =
      this.stubServerMap.get(tag) || this.stubServerMap.get(this.DEFAULT_TAG);
    clearStubs(stubServer);
  };

  public givenStub = (description: string) => {
    const contract = this.contractMap.get(description);
    if (!contract) {
      throw new Error(`Can not find stub by description: ${description}`);
    }
    const { method, queries, uri, headers, json } = contract.getRequest();
    const stubServer =
      this.stubServerMap.get(contract.getTag()) ||
      this.stubServerMap.get(this.DEFAULT_TAG);
    if (method === 'GET') {
      stubFor(
        stubServer,
        get(
          urlEqualTo(encodeURI(componseQueryString(uri, queries))),
          preprocessQueryParams(queries),
          headers,
        ).willReturn(
          a_response()
            .withStatus(contract.getResponse().status)
            .withHeader(contract.getResponse().headers)
            .withBody(contract.getResponse().json),
        ),
      );
    } else {
      stubFor(
        stubServer,
        methods[`_${method.toUpperCase()}`](
          urlEqualTo(encodeURI(uri)),
          json,
          headers,
        ).willReturn(
          a_response()
            .withStatus(contract.getResponse().status)
            .withHeader(contract.getResponse().headers)
            .withBody(contract.getResponse().json),
        ),
      );
    }
  };
}
