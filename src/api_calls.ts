import axios from "axios";
import * as core from "@actions/core";
import {Task} from './types'

export async function getTask(
    task_id: string,
    team_id: string,
    token: string,
    response_fields: string[]
): Promise<Task> {
    console.log(task_id, team_id, token)

    const endpoint = `https://api.clickup.com/api/v2/task/${task_id}/?custom_task_ids=true&team_id=${team_id}`
    const result = await axios.get(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })

    core.debug(`GET request for ${task_id} output:`)
    core.debug(JSON.stringify(result.data))

    let output = result.data
    if (response_fields.length >= 1) {
        const keys : string[] = Object.keys(output);
        const keysToDelete = keys.filter(function(value) {
            return !response_fields.includes(value);
        });

        keysToDelete.forEach(function (keyToDelete) {
            delete output[keyToDelete]
        });
    }

    return output;
}
