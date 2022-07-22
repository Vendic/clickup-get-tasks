import * as core from '@actions/core'
import {getTask} from './api_calls'
import {Task} from './types'

export default async function get_tasks(): Promise<void> {
    try {
        let failed: boolean = false;
        const token: string = core.getInput('clickup_token')
        const task_ids: string[] = core.getMultilineInput('clickup_custom_task_ids')
        const response_fields: string[] = core.getMultilineInput('response_fields') ?? []
        const team_id: string = core.getInput('clickup_team_id')
        const convert_quotes: boolean = core.getBooleanInput('convert_quotes') ?? true
        let tasks: Task[] = []

        for (const task_id of task_ids) {
            try {
                let task = await getTask(task_id, team_id, token, response_fields);

                if (convert_quotes) {
                    Object.keys(task).forEach(function (key : string) {
                        if (typeof task[key as keyof Task] === 'string') {
                            task[key as keyof Task] = convertQuotesToHtml(task[key as keyof Task]);
                        }
                    });
                }

                tasks.push(task);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    failed = true
                    core.info(`${task_id} error: ${error.message}`)
                    core.debug(`Error output for ${task_id}`)
                    core.debug(JSON.stringify(error))
                }
            }
        }

        core.setOutput('clickup_tasks', JSON.stringify(tasks))

        if (failed) {
            throw 'One of the API requests has failed. Please check the logs for more details.'
        }

    } catch (error) {
        core.setFailed(`Action failed: ${error}`)
    }
}


/**
 * @description convert single and double quotes to html characters
 * @param string
 */
function convertQuotesToHtml(string : string) : string
{
    string = string.replace(/"/g, "&quot;");
    string = string.replace(/'/g, "&#39;");
    return string;
}
