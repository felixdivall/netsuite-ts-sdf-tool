export function isValidFileName(fileName: string) {
    const regex = /^[a-z_]+(?:\.ts)?$/ // regular expression: allows only lowercase a-z, _, and ., and must end with .ts
    return regex.test(fileName)
}
