export interface ContractRequest {
  method: 'GET' | 'POST';
  uri: string;
  queries?: { [key: string]: any };
  headers?: { [key: string]: any };
  json?: { [key: string]: any };
}

export interface ContractResponse {
  status: number;
  headers?: { [key: string]: any };
  json?: { [key: string]: any };
}

export class Contract {
  private description: string;

  private tag: string;

  private request: ContractRequest;

  private response: ContractResponse;

  constructor(
    description: string,
    request: ContractRequest,
    response: ContractResponse,
  ) {
    this.description = description;
    const tagRegexMatch = /\[([\s\S]*)\][\s\S]*/.exec(description);
    this.tag = tagRegexMatch && tagRegexMatch.length > 1 && tagRegexMatch[1];
    this.request = request;
    this.response = response;
  }

  public getDescription = () => {
    return this.description;
  };

  public getTag = () => {
    return this.tag;
  };

  public getRequest = () => {
    return this.request;
  };

  public getResponse = () => {
    return this.response;
  };
}
