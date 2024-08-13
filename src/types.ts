export type Task = {
    url : string,
    description: string,
    custom_id: string,
    priority?: Priority,
}

export type Priority = {
    color: string; // Optional property for color
    id: string;
    orderindex: string;
    priority: string;
};