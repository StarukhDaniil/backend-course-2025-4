import { Command } from 'commander'
import fs from 'fs';
import http from 'http';

const program = new Command();


program
    .requiredOption('-i, --input <path>', 'path to JSON with NBU data')
    .requiredOption('-h, --host <link>', 'link to host')
    .requiredOption('-p, --port <number>', 'server port')
    .configureOutput({
        writeErr: (str) => {
            if (str.toLowerCase().includes('required option \'-i, --input <path>\' not specified')) {
                console.error('Please, specify input file');
            }
            else if (str.toLowerCase().includes('option \'-i, --input <path>\' argument missing')) {
                console.error('Cannot find input file');
            }
            else if (str.toLowerCase().includes('required option \'-h, --host <link>\' not specified')) {
                console.error('Please, specify host');
            }
            else if (str.toLowerCase().includes('option \'-h, --host <link>\' argument missing')) {
                console.error('Cannot find host');
            }
            else if (str.toLowerCase().includes('required option \'-p, --port <path>\' not specified')) {
                console.error('Please, specify port');
            }
            else if (str.toLowerCase().includes('option \'-p, --input <port>\' argument missing')) {
                console.error('Cannot find port');
            }
            else {
                console.error(str);
            }
            process.exit(1);
        }
    });

program.parse(program.argv);

const options = program.opts();