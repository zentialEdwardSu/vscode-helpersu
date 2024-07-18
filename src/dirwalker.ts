import * as fs from 'fs';
import * as path from 'path';

type FILE_KIND = 'file' | 'dir'

interface WalkerOptions {
    withFileTypes?: boolean
    withParent?: boolean
}

export interface WalkerResult {
    path: string
    kind: FILE_KIND
}

export const toString = (wr: WalkerResult[]) => {
    return wr.map(w => `{${w.path}:${w.kind}}`).join(',')
}

/**
 * Search for files in a directory with given suffixes.
 * @param dir The directory path to search.
 * @param suffixes An array of suffixes to filter the results.
 * @returns A promise that resolves to an array of file paths matching the suffixes.
 */
export const walker = async (dir: string, suffixes?: Array<string>, options?: WalkerOptions) => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const result: WalkerResult[] = [];

    for (const entry of entries) {
        var fullPath = entry.name
        let path_stat: FILE_KIND | undefined = undefined
        const stat = await fs.promises.stat(path.join(dir, entry.name));
        if (stat.isDirectory()) {
            path_stat = 'dir';
        } else {
            path_stat = 'file';
        }

        if (!path_stat) {
            console.error(`ByPassing to stat ${path.join(dir, entry.name)}`);
            continue;
        }
        if (options?.withParent) {
            fullPath = path.join(dir, entry.name); 
        }

        if (!suffixes || suffixes.some(suffix => fullPath.endsWith(suffix))) {
            result.push({path:fullPath, kind: path_stat});
        }
    }
    return result;
}
