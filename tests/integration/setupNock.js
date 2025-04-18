const nock = require('nock');

nock('https://api.openai.com', { allowUnmocked: false })
  .persist()
  .post('/v1/chat/completions')
  .reply(
    200,
    [
      // First chunk: the summary line
      'data: {"choices":[{"delta":{"content":"1. **Summary:** Dummy function that adds two numbers.\\n"}}]}\n\n',
      // Second chunk: usage example
      'data: {"choices":[{"delta":{"content":"2. **Usage Example:**\\n```python\\nresult = foo(2, 3)  # 5\\n```"}}]}\n\n',
      // Done
      'data: [DONE]\n\n',
    ].join(''),
    { 'Content-Type': 'text/event-stream' }
  );
