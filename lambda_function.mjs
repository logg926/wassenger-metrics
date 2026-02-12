import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = "WassengerMessages";

export const handler = async (event) => {
    // 取得 HTTP 方法 (相容 HTTP API v2 與 REST API v1)
    const method = event.requestContext?.http?.method || event.httpMethod || "GET";

    // 統一 CORS Headers
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Token, Accept"
    };

    // 0. 處理 CORS OPTIONS 預檢請求
    if (method === "OPTIONS") {
        return {
            statusCode: 204,
            headers,
            body: ""
        };
    }

    // 1. 處理 Webhook POST (存入訊息)
    if (method === "POST") {
        try {
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
            if (body.data && body.data.id) {
                const msg = {
                    id: body.data.id,
                    wid: body.data.chat?.id || body.data.wid || body.data.from || "unknown",
                    message: body.data.body || "",
                    direction: body.data.flow === "inbound" ? "in" : "out",
                    createdAt: body.data.date || new Date().toISOString(),
                    agent: body.data.agent || null
                };

                await ddb.send(new PutCommand({
                    TableName: TABLE,
                    Item: msg
                }));
                console.log(`Saved: ${msg.id}`);
            }
            return { 
                statusCode: 200, 
                headers,
                body: JSON.stringify({ message: "OK" }) 
            };
        } catch (e) {
            console.error(e);
            return { 
                statusCode: 500, 
                headers,
                body: JSON.stringify({ error: "Webhook Error" }) 
            };
        }
    }

    // 2. 處理 GET 請求 (提供前端數據)
    if (method === "GET") {
        try {
            const data = await ddb.send(new ScanCommand({ TableName: TABLE }));
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data.Items)
            };
        } catch (e) {
            console.error(e);
            return { 
                statusCode: 500, 
                headers,
                body: JSON.stringify({ error: "Query Error" }) 
            };
        }
    }

    return { 
        statusCode: 404, 
        headers,
        body: JSON.stringify({ error: "Not Found" }) 
    };
};
