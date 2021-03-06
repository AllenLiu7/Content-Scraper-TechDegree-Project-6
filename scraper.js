const rp = require('request-promise');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment');
const winston = require('winston');
const mkdirp = require('mkdirp');

//use moment moudule to format the time
const now = moment().format('YYYY-MM-DD');
const nowLogger = moment().format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ [(PST)]');
const mainURL = "http://shirts4mike.com/";
const entryURL = "shirts.php";
let productURL = [];

//create the 'data' folder
mkdirp('./data', function (err) {
    if (err) console.error(err)
    else console.log('Folder Done')
});
//write data to the csv file
const writeStream = fs.createWriteStream(`./data/${now}.csv`);

//write headers
writeStream.write(`Title,Price,ImageURL,URL,Time \n`);

//logger using winston
let logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => {
            return `${nowLogger} ${info.level}: ${info.message}`;
        })
    ),
    transports: [new winston.transports.File({filename: 'scraper-error.log'})]
});

//request html from "http://shirts4mike.com/shirts.php
request(`${mainURL}${entryURL}`, (error, response, html) => {
    if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);
        //get the href for each shirt and put them in array
        $('.products li a').each((i, el) => {
            productURL.push($(el).attr('href'));
        });
        //request each href to get the data we need
        productURL.forEach((el, i) => {
            request(`${mainURL}${el}`, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    const $ = cheerio.load(html);
    
                    const Title = $('.shirt-details h1').text().slice(4).replace(',', '');             
                    const Price = $('.shirt-details').find('span').text();
                    const ImageURL = $('.shirt-picture span img').attr('src');
                    const URL = `${mainURL}${el}`;
                    const Time = now;
                    //write the data to a CSV file
                    writeStream.write(`${Title}, ${Price}, ${ImageURL}, ${URL}, ${Time} \n`);


                };
            });
        });
        console.log('Scrapping Done')
    } else {
        console.log("There’s been a 404 error. Cannot connect to http://shirts4mike.com.");
        //log the error message to a error file
        logger.log('info', 'There’s been a 404 error. Cannot connect to http://shirts4mike.com.');
    }
    
});

