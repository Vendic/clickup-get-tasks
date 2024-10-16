import * as core from '@actions/core';
import { expect, describe, it, beforeEach, jest } from '@jest/globals';
import get_tasks from '../src/get_tasks';
import { Task } from '../src/types';
import {getTask} from "../src/api_calls";

jest.mock('@actions/core');
jest.mock('../src/api_calls');

const mockedCore = core as jest.Mocked<typeof core>;
const mockedGetTask = getTask as jest.MockedFunction<typeof getTask>;

describe('get_tasks', () => {
    const defaultTaskIds = ['TASK-1', 'TASK-2', 'INVALID-TASK'];
    const defaultResponseFields = ['url', 'description', 'custom_id', 'priority'];
    const task1: Task = {
        url: 'https://app.clickup.com/t/TASK-1',
        description: 'Task "One" description',
        custom_id: 'TASK-1',
        priority: {
            color: '#ff0000',
            id: '1',
            orderindex: '1',
            priority: 'High',
        },
    };
    const task2: Task = {
        url: 'https://app.clickup.com/t/TASK-2',
        description: "It's the second task",
        custom_id: 'TASK-2',
        priority: {
            color: '#00ff00',
            id: '2',
            orderindex: '2',
            priority: 'Normal',
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();

        // Mock core inputs
        mockedCore.getInput.mockImplementation((name: string) => {
            const inputs: Record<string, string> = {
                clickup_token: 'test_token',
                clickup_team_id: 'test_team_id',
            };
            return inputs[name] || '';
        });

        mockedCore.getMultilineInput.mockImplementation((name: string) => {
            const multilineInputs: Record<string, string[]> = {
                clickup_custom_task_ids: defaultTaskIds,
                response_fields: defaultResponseFields,
            };
            return multilineInputs[name] || [];
        });

        mockedCore.getBooleanInput.mockImplementation((name: string) => {
            const booleanInputs: Record<string, boolean> = {
                convert_quotes: true,
            };
            return booleanInputs[name] ?? true;
        });

        // Mock core output functions
        jest.spyOn(mockedCore, 'setOutput');
        jest.spyOn(mockedCore, 'setFailed');
        jest.spyOn(mockedCore, 'info');
        jest.spyOn(mockedCore, 'debug');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('retrieves tasks and converts quotes when convert_quotes is true', async () => {
        // Arrange
        mockedGetTask.mockImplementation(async (taskId: string) => {
            if (taskId === 'TASK-1') return { ...task1 };
            if (taskId === 'TASK-2') return { ...task2 };
            const error = new Error('Task not found');
            (error as any).response = { status: 404 };
            throw error;
        });

        const expectedTasks = [
            {
                ...task1,
                description: 'Task &quot;One&quot; description',
            },
            {
                ...task2,
                description: 'It&#39;s the second task',
            },
        ];

        // Act
        await get_tasks();

        // Assert
        expect(mockedGetTask).toHaveBeenCalledTimes(3);
        expect(mockedCore.setOutput).toHaveBeenCalledWith('clickup_tasks', JSON.stringify(expectedTasks));
        expect(mockedCore.setOutput).toHaveBeenCalledWith('invalid_tasks', JSON.stringify(['INVALID-TASK']));
        expect(mockedCore.setFailed).not.toHaveBeenCalled();
    });

    it('does not convert quotes when convert_quotes is false', async () => {
        // Arrange
        mockedCore.getBooleanInput.mockReturnValue(false);

        mockedGetTask.mockImplementation(async (taskId: string) => {
            if (taskId === 'TASK-1') return { ...task1 };
            if (taskId === 'TASK-2') return { ...task2 };
            const error = new Error('Task not found');
            (error as any).response = { status: 404 };
            throw error;
        });

        const expectedTasks = [task1, task2];

        // Act
        await get_tasks();

        // Assert
        expect(mockedGetTask).toHaveBeenCalledTimes(3);
        expect(mockedCore.setOutput).toHaveBeenCalledWith('clickup_tasks', JSON.stringify(expectedTasks));
        expect(mockedCore.setOutput).toHaveBeenCalledWith('invalid_tasks', JSON.stringify(['INVALID-TASK']));
        expect(mockedCore.setFailed).not.toHaveBeenCalled();
    });

    it('handles empty task IDs gracefully', async () => {
        // Arrange
        mockedCore.getMultilineInput.mockImplementation((name: string) => {
            if (name === 'clickup_custom_task_ids') return [];
            return defaultResponseFields;
        });

        // Act
        await get_tasks();

        // Assert
        expect(mockedGetTask).not.toHaveBeenCalled();
        expect(mockedCore.setOutput).toHaveBeenCalledWith('clickup_tasks', JSON.stringify([]));
        expect(mockedCore.setOutput).toHaveBeenCalledWith('invalid_tasks', JSON.stringify([]));
        expect(mockedCore.setFailed).not.toHaveBeenCalled();
    });

    it('collects invalid task IDs when getTask throws errors', async () => {
        // Arrange
        mockedGetTask.mockRejectedValue(new Error('Network Error'));

        // Act
        await get_tasks();

        // Assert
        expect(mockedGetTask).toHaveBeenCalledTimes(3);
        expect(mockedCore.setOutput).toHaveBeenCalledWith('clickup_tasks', JSON.stringify([]));
        expect(mockedCore.setOutput).toHaveBeenCalledWith('invalid_tasks', JSON.stringify(defaultTaskIds));
        expect(mockedCore.setFailed).not.toHaveBeenCalled();
    });

    it('fails the action if an error occurs outside the loop', async () => {
        // Arrange
        mockedCore.getInput.mockImplementation((name: string) => {
            if (name === 'clickup_token') throw new Error('Input required and not supplied: clickup_token');
            return '';
        });

        // Act
        await get_tasks();

        // Assert
        expect(mockedCore.setFailed).toHaveBeenCalledWith(
            'Action failed: Error: Input required and not supplied: clickup_token'
        );
        expect(mockedCore.setOutput).not.toHaveBeenCalled();
    });
});
