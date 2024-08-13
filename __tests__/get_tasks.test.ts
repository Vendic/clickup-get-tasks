import * as core from '@actions/core'
import * as fs from "fs";
import nock from "nock";
import {expect, test} from '@jest/globals'
import get_tasks from '../src/get_tasks'

test('Test get 2 tasks from Clickup API', async () => {
    // Mocks
    const failed_mock = jest.spyOn(core, 'setFailed')
    const output_mock = jest.spyOn(core, 'setOutput')

    const get_reply = JSON.parse(fs.readFileSync(__dirname + '/' + 'get_response.json', 'utf-8'))
    nock('https://api.clickup.com')
        .persist()
        .get('/api/v2/task/ABC-185/?custom_task_ids=true&team_id=123')
        .reply(200, get_reply)
    nock('https://api.clickup.com')
        .persist()
        .get('/api/v2/task/DEF-186/?custom_task_ids=true&team_id=123')
        .reply(200, get_reply)

    await get_tasks()

    const expected_output = JSON.stringify([
        {
            "custom_id": "TEST123",
            "description": "Price isn&#39;t correct &quot;displayed&quot; in the rich snippets",
            "priority": {
                "color": "#d8d8d8",
                "id": "4",
                "orderindex": "4",
                "priority": "low"
            },
            "url": "https://app.clickup.com/t/9hx"
        },
        {
            "custom_id": "TEST123",
            "description": "Price isn&#39;t correct &quot;displayed&quot; in the rich snippets",
            "priority": {
                "color": "#d8d8d8",
                "id": "4",
                "orderindex": "4",
                "priority": "low"
            },
            "url": "https://app.clickup.com/t/9hx"
        }
    ]);

    expect(failed_mock).toHaveBeenCalledTimes(0)
    expect(output_mock).toHaveBeenCalledWith('clickup_tasks', expected_output)
})

beforeEach(() => {
    process.env['INPUT_CLICKUP_TOKEN'] = 'pk_123'
    process.env['INPUT_RESPONSE_FIELDS'] = 'url\ndescription\ncustom_id\npriority'
    process.env['INPUT_CLICKUP_CUSTOM_TASK_IDS'] = 'ABC-185\nDEF-186'
    process.env['INPUT_CLICKUP_TEAM_ID'] = '123'
    process.env['INPUT_CONVERT_QUOTES'] = 'true'
})
