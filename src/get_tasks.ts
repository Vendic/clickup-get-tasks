import * as core from '@actions/core'
import {getTask} from './api_calls'
import {Task} from './types'

export default async function get_tasks(): Promise<void> {
    try {
        let failed: boolean = false;
        const token: string = core.getInput('clickup_token')
        const task_ids: string[] = core.getMultilineInput('clickup_custom_task_ids')
        const team_id: string = core.getInput('clickup_team_id')
        let tasks: Task[] = [];

        for (const task_id of task_ids) {
            try {
                let task = await getTask(task_id, team_id, token);
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
