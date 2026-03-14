declare module 'nodemailer/lib/addressparser' {
    export interface ParsedAddress {
        address?: string;
        name?: string;
        group?: ParsedAddress[];
    }

    export default function addressParser(input: string): ParsedAddress[];
}
