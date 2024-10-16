import * as core from '@actions/core';
import { getTask } from './api_calls';
import { Task } from './types';

export default async function get_tasks(): Promise<void> {
    try {
        const token: string = core.getInput('clickup_token');
        const task_ids: string[] = core.getMultilineInput('clickup_custom_task_ids');
        const response_fields: string[] = core.getMultilineInput('response_fields') ?? [];
        const team_id: string = core.getInput('clickup_team_id');
        const convert_quotes: boolean = core.getBooleanInput('convert_quotes') ?? true;
        let tasks: Task[] = [];
        let invalid_tasks: string[] = [];

        for (const task_id of task_ids) {
            try {
                let task = await getTask(task_id, team_id, token, response_fields);

                if (convert_quotes) {
                    Object.keys(task).forEach(function (key: string) {
                        const value = task[key as keyof Task];
                        if (typeof value === 'string') {
                            task[key as keyof Task] = convertQuotesToHtml(value) as any;
                        }
                    });
                }

                tasks.push(task);
            } catch (error: any) {
                if (error instanceof Error) {
                    core.info(`${task_id} error: ${error.message}`);
                    core.debug(`Error output for ${task_id}`);
                    core.debug(JSON.stringify(error));
                    invalid_tasks.push(task_id);
                }
            }
        }

        core.setOutput('clickup_tasks', JSON.stringify(tasks));
        core.setOutput('invalid_tasks', JSON.stringify(invalid_tasks));
    } catch (error) {
        core.setFailed(`Action failed: ${error}`);
    }
}

/**
 * @description convert single and double quotes to html characters
 * @param string
 */
function convertQuotesToHtml(string: string): string {
    string = string.replace(/"/g, '&quot;');
    string = string.replace(/'/g, '&#39;');
    return string;
}
