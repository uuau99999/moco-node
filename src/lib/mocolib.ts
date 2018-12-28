import * as fs from 'fs';
import * as path from 'path';
import { Contract } from './contract';
import {
  jswiremock,
  stubFor,
  post,
  get,
  urlEqualTo,
  a_response,
} from 'node-jswiremock';

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
    if (err) {
      console.error(err);
    }
    if (data) {
      results.push(data);
    }
  });
  const contractGroupList = await Promise.all(results);
  const _contractMap = new Map<string, Contract>();
  contractGroupList.forEach(contractGroup => {
    contractGroup.forEach(contract => {
      _contractMap.set(contract.getDescription(), contract);
    });
  });
  return _contractMap;
};

export class MocoServer {
  private contractMap: Map<string, Contract> | null;

  private contractPath: string;

  private stubServerPort: number;

  private stubServer: jswiremock;

  constructor(contractPath: string, port: number) {
    this.contractPath = contractPath;
    this.stubServerPort = port;
  }

  public buildContractMap = async () => {
    this.contractMap = await buildContractTreeFromDirectory(this.contractPath);
  };

  public cleanContractMap = () => {
    this.contractMap && this.contractMap.clear();
  };

  public start = async () => {
    await this.buildContractMap();
    this.stubServer = new jswiremock(this.stubServerPort);
  };

  public stop = () => {
    this.stubServer.stopJSWireMock();
  };

  public getContratMap = () => {
    return this.contractMap;
  };

  public givenStub = (description: string) => {
    const contract = this.contractMap.get(description);
    const { method, queries, uri, headers, json } = contract.getRequest();
    if (method === 'GET') {
      stubFor(
        this.stubServer,
        get(urlEqualTo(encodeURI(uri)), queries, headers).willReturn(
          a_response()
            .withStatus(contract.getResponse().status)
            .withHeader(contract.getResponse().headers)
            .withBody(contract.getResponse().json),
        ),
      );
    } else if (method === 'POST') {
      stubFor(
        this.stubServer,
        post(urlEqualTo(encodeURI(uri)), json, headers).willReturn(
          a_response()
            .withStatus(contract.getResponse().status)
            .withHeader(contract.getResponse().headers)
            .withBody(contract.getResponse().json),
        ),
      );
    }
  };
}
