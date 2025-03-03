import Node from "../Node";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
    StreamNodeSpecificationInputType,
    StreamNodeSpecificationOutputType,
    StreamNodeSpecificationV2,
} from "hcloud-sdk/lib/interfaces/high5";
import https from "https";

enum Input {
    MASV_HOST = "MASV host",
    TIMEOUT = "Timeout",
    FOLLOW_REDIRECTS = "Follow Redirects",
    IGNORE_INVALID_SSL_CERTIFICATE = "Ignore invalid SSL Certificate",
}

enum Output {
    EXECUTION = "Execution",
    STATUS_CODE = "Status Code",
    HEADERS = "Headers",
    BODY = "Body",
    DURATION = "Run time",
}

interface HttpResponse {
    [Output.STATUS_CODE]: number;
    [Output.HEADERS]: object;
    [Output.BODY]: string | object;
}

export default class MasvGetCurrentUsersConnection extends Node {
    specification: StreamNodeSpecificationV2 = {
        specVersion: 2,
        name: "MASV - Get current users connection",
        description:
            "Retrieves the current user's connection details from the MASV service and passes on the full JSON response",
        category: "Networking",
        version: {
            major: 0,
            minor: 0,
            patch: 1,
            changelog: [],
        },
        author: {
            name: "",
            company: "",
            email: "",
        },
        inputs: [
            {
                name: Input.MASV_HOST,
                description: "Enter the MASV host URL (e.g., http://192.168.122.220:9980)",
                type: StreamNodeSpecificationInputType.STRING,
                example: "http://192.168.122.220:9980",
                mandatory: true,
            },
            {
                name: Input.TIMEOUT,
                description: "Enter the number of seconds to wait for a response before timing out",
                type: StreamNodeSpecificationInputType.NUMBER,
                example: 10,
                defaultValue: 60,
            },
            {
                name: Input.FOLLOW_REDIRECTS,
                description: "Enable if the node should follow HTTP redirects",
                type: StreamNodeSpecificationInputType.BOOLEAN,
                example: true,
                defaultValue: true,
            },
            {
                name: Input.IGNORE_INVALID_SSL_CERTIFICATE,
                description: "Enable to ignore invalid SSL certificates",
                type: StreamNodeSpecificationInputType.BOOLEAN,
                example: false,
                defaultValue: false,
            },
        ],
        outputs: [
            {
                name: Output.EXECUTION,
                description:
                    "Response data - status code, headers and body",
                type: StreamNodeSpecificationOutputType.JSON,
                example: {
                    [Output.STATUS_CODE]: 200,
                    [Output.HEADERS]: {
                        "Content-Type": "application/json",
                        Server: "Apache/2.4.1",
                        "Set-Cookie": "sessionId=abc123; Path=/; HttpOnly",
                        Date: "Wed, 21 Oct 2024 07:28:00 GMT",
                        Connection: "keep-alive",
                    },
                    [Output.BODY]: '{ "userId": 123, "userName": "HelmutCloud", "email": "hellofrom@helmut.cloud" }',
                },
            },
            {
                name: Output.DURATION,
                description:
                    "Returns the total amount of time taken by the node to execute the node in milliseconds",
                type: StreamNodeSpecificationOutputType.NUMBER,
                example: 200,
            },
        ],
    };

    async execute(): Promise<void> {
        const startTime = performance.now();
        const masvHost = this.wave.inputs.getInputValueByInputName(Input.MASV_HOST) as string;
        const timeout = this.wave.inputs.getInputValueByInputName(Input.TIMEOUT) as number;
        const followRedirects = this.wave.inputs.getInputValueByInputName(Input.FOLLOW_REDIRECTS) as boolean;
        const ignoreSSLCert = this.wave.inputs.getInputValueByInputName(Input.IGNORE_INVALID_SSL_CERTIFICATE) as boolean;

        // Build the full URL by appending the fixed endpoint
        const url = `${masvHost.replace(/\/+$/, "")}/api/v1/login`;

        const requestConfig: AxiosRequestConfig = {
            method: "GET",
            url: url,
            timeout: timeout * 1000,
            transformResponse: (res) => res,
        };

        if (ignoreSSLCert) {
            const agent = new https.Agent({ rejectUnauthorized: false });
            requestConfig.httpsAgent = agent;
        }

        requestConfig.validateStatus = (status) => status >= 200 && status < 300;
        if (!followRedirects) {
            const oldValidateStatus = requestConfig.validateStatus;
            requestConfig.validateStatus = (s) => {
                if (s >= 300 && s < 400) {
                    return false;
                }
                return oldValidateStatus(s);
            };
            requestConfig.maxRedirects = 0;
        }

        try {
            const res = await axios.request(requestConfig);
            const output: HttpResponse = {
                [Output.STATUS_CODE]: res.status,
                [Output.HEADERS]: res.headers,
                [Output.BODY]: this.parseBody(res),
            };

            this.wave.outputs.setOutput(Output.EXECUTION, output);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const output: HttpResponse = {
                    [Output.STATUS_CODE]: err.response?.status,
                    [Output.HEADERS]: err.response?.headers,
                    [Output.BODY]: err.response?.data,
                };
                this.wave.outputs.setOutput(Output.EXECUTION, output);
                throw new Error(err.name + ": " + err.message);
            } else {
                throw err;
            }
        } finally {
            this.wave.outputs.setOutput(Output.DURATION, performance.now() - startTime);
        }
    }

    parseBody(response: AxiosResponse): string | object {
        const contentType = response.headers["content-type"];
        if (!contentType) {
            return response.data;
        }
        if (contentType.includes("application/json")) {
            try {
                return JSON.parse(response.data);
            } catch (_) {
                return response.data;
            }
        }
        return response.data;
    }
}
