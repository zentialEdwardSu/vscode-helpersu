import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const escapeRegex = (pattern: string) => pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isVaildFloder = (p: string,b:string):boolean => {
    p = vscode.Uri.parse(p).fsPath
    try {
        if(p.startsWith('./') || p.startsWith('../')) p = path.resolve(b, p)
        return fs.existsSync(p)
    } catch (error) {
        return false
    }
}

const guaranteeFloder = (p: string,b:string):string|undefined => {
    const slash_index = p.indexOf('/');
    for (let i = 0; i <= slash_index; i++) {
        const t = p.slice(i)
        if (isVaildFloder(t,b)) {
            return t
        }
    }
    return undefined
}

export const extratPath = (line: string, endpattern: string, basepath: string, slice:boolean = true) => {
    const endescape = escapeRegex(endpattern);
    const regex1 = `(?:\.\.\/|\.\/|\/).*${endescape}`
    const result = line.match(regex1);
    if (!result) {
        return undefined
    }
    let final_res= result[0].slice(0, -endpattern.length);
    if (!final_res.startsWith('/') || !final_res.startsWith('./') || !final_res.startsWith('../')) {
        return guaranteeFloder(final_res,basepath)
    }
    return final_res
}