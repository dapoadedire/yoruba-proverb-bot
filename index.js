require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('Initializing bot...');
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const proverbs = require('./proverbs.json');
const allProverbs = proverbs.proverbs;
const commands = {
    "/start": {
        description: "Start the bot."
    },
    "/random": {
        description: "Get a random proverb.",
        options: [
            { description: "Get 3 random proverbs.", usage: "/random 3" }
        ]
    },
    "/search": {
        description: "Search for proverbs.",
        options: [
            { description: "Search for proverbs.", usage: "/search <query>" },
            { description: "Search for 3 proverbs.", usage: "/search <query> 3" }
        ]
    },
    "/id": {
        description: "Get a proverb by id.",
        options: [
            { description: "Get a proverb with id 1.", usage: "/id 1" }
        ]
    },
    "/help": {
        description: "List all commands.",
        options: [
            { description: "Get help for a command.", usage: "/help <command>" }
        ]
    }
};



function formatProverb(proverb) {
    const response= `${proverb.id}

Proverb: ${proverb.proverb}
Translation: ${proverb.translation}
Wisdom: ${proverb.wisdom}`;
    return response;
}

function getProverbById(id) {
    const proverb = allProverbs.find((proverb) => proverb.id === Number(id));
    return proverb ? formatProverb(proverb) : null;
}





async function handleStartCommand(msg) {
    const welcomeMessage = `Welcome to the Yoruba Proverb Bot! 

I can share with you some of the most popular proverbs from the Yoruba culture.
Just type /random to receive a random one.
Or type /help to see a list of all available commands.
Enyoy!`;

    try {
        await bot.sendMessage(msg.chat.id, welcomeMessage);
        console.log('Sent a welcome message to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
    } catch (err) {
        console.error(err);
    }
}


async function handleRandomCommand(msg) {
    let count = 1;
    const args = msg.text.split(' ').slice(1);
    if (args.length > 0) {
        count = parseInt(args[0]);
        if (isNaN(count)) {
            bot.sendMessage(msg.chat.id, 'Invalid argument: ' + args[0]);
            return;
        } else if (count > 5) {
            bot.sendMessage(msg.chat.id, 'Max limit is 5');
            return;
        }
    }
    const randomProverbs = [];
    for (let i = 0; i < count; i++) {
        randomProverbs.push(allProverbs[Math.floor(Math.random() * allProverbs.length)]);
    }
    const randomProverbsMessage = randomProverbs.map((proverb) => formatProverb(proverb)).join('\n\n');
    await bot.sendMessage(msg.chat.id, randomProverbsMessage);
    console.log('Sent ' + count + ' random proverbs to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
}


async function handleSearchCommand(msg) {
    try {
        const args = msg.text.split(' ').slice(1);
        if (args.length === 0) {
            await bot.sendMessage(msg.chat.id, 'Invalid command. Please try again.');
            console.log(`Sent an error message to ${msg.from.first_name} ${msg.from.last_name}`);
            return;
        }
        let count = 1;
        let query = args.join(' ');
        if (args.length > 1) {
            count = parseInt(args[args.length - 1]);
            if (isNaN(count)) {
                await bot.sendMessage(msg.chat.id, 'Invalid argument: ' + args[args.length - 1]);
                console.log(`Sent an error message to ${msg.from.first_name} ${msg.from.last_name}`);

                return;
            } else if (count > 5) {
                await bot.sendMessage(msg.chat.id, 'Max limit is 5');
                console.log(`Sent an error message to ${msg.from.first_name} ${msg.from.last_name}`);

                return;
            }
            query = args.slice(0, args.length - 1).join(' ');
        }
        const searchResults = allProverbs.filter((proverb) => proverb.translation.toLowerCase().includes(query.toLowerCase()));
        if (searchResults.length === 0) {
            await bot.sendMessage(msg.chat.id, 'No proverbs found for query: ' + query);
            console.log(`Sent an error message to ${msg.from.first_name} ${msg.from.last_name}`);

            return;
        }
        const randomSearchResults = [];
        for (let i = 0; i < count; i++) {
            randomSearchResults.push(searchResults[Math.floor(Math.random() * searchResults.length)]);
        }
        const randomSearchResultsMessage = randomSearchResults.map((proverb) => formatProverb(proverb)).join('\n\n');
        await bot.sendMessage(msg.chat.id, randomSearchResultsMessage);
        console.log('Sent ' + count + ' random proverbs matching query ' + query + ' to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
    } catch (error) {
        console.error('Error in handleSearchCommand:', error);
        await bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your command. Please try again later.');
    }
}



async function handleIdCommand(msg) {
    const id = msg.text.split(' ').slice(1).join(' ');
    const proverb = getProverbById(id);
    if (proverb) {
        await bot.sendMessage(msg.chat.id, proverb);
        console.log('Sent proverb with id ' + id + ' to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
    } else {
        await bot.sendMessage(msg.chat.id, 'Proverb with id ' + id + ' not found.');
        console.log('Failed to send proverb with id ' + id + ' to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
    }
}

async function handleUnknownCommand(msg) {
    const unknownCommandMsg = 'Unknown command. Please try again. \nTo see a list of available commands, type /help.';
    await bot.sendMessage(msg.chat.id, unknownCommandMsg);
    console.log(`Sent an error message to ${msg.from.first_name} ${msg.from.last_name}`);
}



async function handleHelpCommand(msg) {
    const args = msg.text.split(' ').slice(1);
    if (args.length === 0) {
        let helpMessage = "\n";
        for (let command in commands) {
            helpMessage += `${command} - ${commands[command].description}\n`;
            if (commands[command].options) {
                for (let option of commands[command].options) {
                    helpMessage += `${option.usage} - ${option.description}\n`;
                }
                helpMessage += "\n";
            }
        }
        await bot.sendMessage(msg.chat.id, helpMessage);
        console.log('Sent a list of all commands and options to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
    } else {
        const command = args[0];
        if (commands[command]) {
            let helpMessage = `${command} - ${commands[command].description}\n`;
            if (commands[command].options) {
                for (let option of commands[command].options) {
                    helpMessage += `${option.usage} - ${option.description}\n`;
                }
            }
            await bot.sendMessage(msg.chat.id, helpMessage);
            console.log('Sent help for command ' + command + ' to ' + msg.from.first_name + ' ' + msg.from.last_name + '.');
        } else {
            await bot.sendMessage(msg.chat.id, 'Unknown command. Please try again.');
        }
    }
}


console.log('Bot initialized successfully.');
bot.on('message', async (msg) => {
    if (!msg.text) {
        bot.sendMessage(msg.chat.id, 'Sorry, I can only process text messages.');
    } else {
        const command = msg.text.split(' ')[0];
        switch (command) {
            case '/start':
                await handleStartCommand(msg);
                break;
            case '/help':
                await handleHelpCommand(msg);
                break;
            case '/random':
                await handleRandomCommand(msg);
                break;
            case '/search':
                await handleSearchCommand(msg);
                break;
            case '/id':
                await handleIdCommand(msg);
                break;
            default:
                await handleUnknownCommand(msg);
        }
    }
});

console.log('Bot is listening for commands...');




