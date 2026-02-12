# AWS Lambda + DynamoDB 績效監控設定指南 (相容版)

## 1. Lambda 部署步驟
1.  在 AWS Lambda 編輯器中，確保檔案名稱是 **`index.js`**。
2.  將 `lambda_function.js` 的內容完整貼上。
3.  點擊 **Deploy**。

## 2. 測試 Webhook (Lambda Test Event)
建立一個名為 `TestWebhook` 的事件：
```json
{
  "requestContext": {
    "http": {
      "method": "POST"
    }
  },
  "body": "{\"event\":\"message:in:new\",\"data\":{\"id\":\"test_msg_001\",\"from\":\"user@c.us\",\"body\":\"測試提問\",\"flow\":\"inbound\",\"date\":\"2026-02-12T10:00:00Z\"}}"
}
```

## 3. 測試讀取資料 (Lambda Test Event)
建立一個名為 `TestGet` 的事件：
```json
{
  "requestContext": {
    "http": {
      "method": "GET"
    }
  }
}
```

## 4. 常見問題
*   **SyntaxError: import**: 請使用這個 `require` 版本的程式碼。
*   **AccessDenied**: 請在 IAM Role 加入 `AmazonDynamoDBFullAccess`。
