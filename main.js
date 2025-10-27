import { Command } from 'commander';
import { XMLBuilder } from 'fast-xml-parser';
import fs from 'fs/promises';
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
            else if (str.toLowerCase().includes('required option \'-p, --port <port>\' not specified')) {
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

program.parse(process.argv);

const options = program.opts();


async function readJSON(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(data);
    return json;
}

function filterJSON(json, rainfall, humidity) {
    const result = json
        .filter(entry => {
            if (rainfall) {
                return entry.Rainfall > rainfall;
            }
            else {
                return true;
            }
        })
        .map(entry => {
            const line = [];

            line.push(entry.Pressure3pm);

            if (rainfall) {
                line.unshift(entry.Rainfall);
            }

            if (humidity) {
                line.push(entry.Humidity3pm);
            }
            return line.join(' ');
        });
    return result;
}

function convertResultToXML(result) {
    const xmlData = {
        records: {
            record: result.map(line => {
            const parts = line.split(' '); // ["Rainfall","Pressure","Humidity"]
            return {
                ...(options.rainfall && { Rainfall: parts.shift() }),
                Pressure3pm: parts[0],
                ...(options.humidity && { Humidity3pm: parts[1] })
            };
            })
        }
    };
    return xmlData;
}

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true
});

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const humidity = url.searchParams.get('h');
    const rainfall = url.searchParams.get('r');

    try {
        const json = await readJSON(options.input);
        if (json != null) {
            const filteredResult = filterJSON(json, rainfall, humidity);
            const xmlObject = convertResultToXML(filteredResult, rainfall, humidity);
            const xmlString = builder.build(xmlObject);
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(xmlString);
        }
    }
    catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error: ' + err.message);
    }

});

server.listen(options.port, () => {
    console.log(`Server started at http://localhost:${options.port}`)
})