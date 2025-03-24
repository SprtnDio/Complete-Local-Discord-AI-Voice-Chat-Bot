const asciiArt = `
⠀⠀⠀⠀⠀⢀⣀⢠⣴⣶⣶⣶⣆⣤⣄⣀⠀⠀
⠀⠀⢀⣤⣾⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⡿⠆
⠀⢀⣺⣿⣿⣿⠁⣛⣭⣥⣴⣤⣬⣍⠛⠉⠀⠀
⢀⣿⣿⣿⡿⠡⣚⣭⣵⣶⣦⣭⣙⠃⠀⠀⠀⠀
⢸⣿⣿⣿⢁⣾⣿⡿⢛⣋⣉⣉⣉⣓⣠⠀⠀⠀
⢸⣿⣿⡏⢸⣿⢇⣾⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀
⢸⣿⡿⠁⣸⣿⡸⣿⣿⣿⡉⠁⠀⢻⣿⠀⠀⠀
⠚⠋⠀⠀⣿⣿⣿⣮⢻⣿⣿⣷⣆⠀⣿⠀⠀⠀
⠀⠀⠀⢀⣿⣿⣿⣿⡇⢿⣿⣿⣿⡄⠃⠀⠀⠀
⠀⠀⠀⠈⠛⠛⠛⠋⠁⢸⣿⣿⣿⣿⣄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠿⠿⠿⠛⠁⠀
     SprtnDio`;
console.log(asciiArt); //asciiArt by: https://emojicombos.com/sparta-ascii-art

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                        🔥 The Flame of Chaos 🔥
// █
// ██████████████████████████████████████████████████████████████████████████████

// --- Module Imports ---
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const vosk = require('vosk');
const prism = require('prism-media');
const { Client, IntentsBitField } = require('discord.js');
const {
    joinVoiceChannel,
    EndBehaviorType,
    createAudioPlayer,
    createAudioResource
} = require('@discordjs/voice');

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                     ⏳ The Clock of the Present ⏳
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Generates a timestamp log prefix with German locale and Berlin timezone.
 * @returns {string} - Timestamp string in the format 'dd.mm.yyyy, hh:mm:ss »'.
 */
const timestampPrefix = () => new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
}) + ' »';

const DEBUG_LOG_FILE = 'console.log'; // Filename for the debug logs
let debugLogFileDescriptor = null; // File Descriptor Variable

// Override console.log to prepend timestamps and write to file
console.log = (original => (...args) => {
    const timestampedLog = timestampPrefix() + ' ' + args.join(' ');
    original.apply(console, [timestampedLog]); // Maintain output in the console

    if (debugLogFileDescriptor !== null) { // Only write if file was opened successfully
        try {
            fs.writeSync(debugLogFileDescriptor, timestampedLog + '\n'); // Write to file + newline
        } catch (error) {
            console.error('⚠️ Error writing to debug log file:', error);
            // Error handling if necessary, e.g., set debugLogFileDescriptor to null to avoid further write attempts
        }
    }
})(console.log);

// Override console.error to prepend timestamps and write to file
console.error = (original => (...args) => {
    const timestampedLog = timestampPrefix() + ' [ERROR] ' + args.join(' '); // [ERROR] Prefix for error logs
    original.apply(console, [timestampedLog]);

    if (debugLogFileDescriptor !== null) {
        try {
            fs.writeSync(debugLogFileDescriptor, timestampedLog + '\n');
        } catch (error) {
            console.error('⚠️ Error writing to debug log file (console.error):', error);
        }
    }
})(console.error);

// Override console.warn to prepend timestamps and write to file
console.warn = (original => (...args) => {
    const timestampedLog = timestampPrefix() + ' [WARN] ' + args.join(' '); // [WARN] Prefix for warning logs
    original.apply(console, [timestampedLog]);

    if (debugLogFileDescriptor !== null) {
        try {
            fs.writeSync(debugLogFileDescriptor, timestampedLog + '\n');
        } catch (error) {
            console.error('⚠️ Error writing to debug log file (console.warn):', error);
        }
    }
})(console.warn);

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                       🌀 Secrets of the Mist 🌀
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Configuration object that contains bot settings and command triggers.
 */
const config = {
    COMMAND_PREFIX: '!', // Prefix "!" for all Commands
    COMMANDS: {
        JOIN: 'join',
        LEAVE: 'leave',
        HELP: 'help'
    },
    TRIGGERS: {
        WAKE_WORD: 'orakel',
        ASK_ORACLE: '!ask',
        IDLE_TIMEOUT: 30000
    },
    VOICE_SETTINGS: {
        TTS_MODEL_PATH: null,
        TTS_EXECUTABLE_PATH: null,
        VOSK_MODEL_PATH: null,
        TEMP_AUDIO_DIR: null,
        TRIGGER_SOUND_PATH: null
    },
    ORACLE_SETTINGS: {
        MODEL_NAME: 'hf.co/Orenguteng/Llama-3.1-8B-Lexi-Uncensored-V2-GGUF:latest', // Here the desired LLM is started, I tested many and the current one runs error-free after extensive testing so far!
        SAFETY_CIRCLES: [],
        PREDICTION_SETTINGS: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048
        }
    },
    GREETINGS: {
        ENABLED_BY_DEFAULT: true,
        COMMAND: '!greetings'
    },
    PURGE_SETTINGS: {
        ENABLED_BY_DEFAULT: false,
        THRESHOLD: 20,
        COMMAND: '!purge',
        PURGE_MODE: 'AUTO'
    },
    DEBUG_SETTINGS: {
        ENABLED_BY_DEFAULT: false,
        COMMAND: '!debug'
    },
    TRANSCRIPTION_SETTINGS: {
        ENABLED_BY_DEFAULT: false,
        COMMAND: '!text'
    },
    INSULT_SETTINGS: { // Configuration for automatic insults
        ENABLED_BY_DEFAULT: false,
        COMMAND: '!insult',
        INTERVAL: 90000, // 90 seconds
        INSULT_PHRASES: ["", "", "", "", "", "", ""] // (List of insults) - Not active, LLM comes up with its own
    }
};

// --- Path Variable Declaration (At the beginning of the code!) ---
let ttsModelPath;
let ttsExecutablePath;
let voskModelPath;
let tempAudioDir;
let triggerSoundPath;

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                       🗝️ The Revelation of Secrets 🗝️
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Loads the bot token and paths from settings.json, exits the process on error.
 * @returns {object} - Object containing DISCORD_TOKEN and PATHS.
 */
const revealSecrets = () => {
    try {
        const treasureMapPath = 'settings.json';
        if (!fs.existsSync(treasureMapPath)) {
            throw new Error('🗺️ The map leads to nowhere!');
        }

        const relics = JSON.parse(fs.readFileSync(treasureMapPath, 'utf8'));
        if (!relics.DISCORD_TOK) {
            throw new Error('🔐 The gate remains locked: DISCORD_TOK is missing!');
        }
        if (!relics.PATHS) {
            throw new Error('🧳 No paths found in settings.json!');
        }
        return relics;
    } catch (dragonRage) {
        console.error(`☠️  Stroke of fate: ${dragonRage.message}`);
        process.exit(1);
    }
};

const secrets = revealSecrets();
const { DISCORD_TOK: botToken, PATHS: paths } = secrets;

// --- Path Variable Population (Immediately after revealSecrets!) ---
ttsModelPath = paths.TTS_MODEL_PATH;
ttsExecutablePath = paths.TTS_EXECUTABLE_PATH;
voskModelPath = paths.VOSK_MODEL_PATH;
tempAudioDir = paths.TEMP_AUDIO_DIR;
triggerSoundPath = paths.TRIGGER_SOUND_PATH;

// --- Configuration object with populated paths ---
config.VOICE_SETTINGS.TTS_MODEL_PATH = ttsModelPath;
config.VOICE_SETTINGS.TTS_EXECUTABLE_PATH = ttsExecutablePath;
config.VOICE_SETTINGS.VOSK_MODEL_PATH = voskModelPath;
config.VOICE_SETTINGS.TEMP_AUDIO_DIR = tempAudioDir;
config.VOICE_SETTINGS.TRIGGER_SOUND_PATH = triggerSoundPath;


// ██████████████████████████████████████████████████████████████████████████████
// █
// █                        🌌 The Guardian of the Stars 🌌
// █
// ██████████████████████████████████████████████████████████████████████████████

// Initialize Discord Client
const discordClient = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ],
    presence: {
        activities: [{
            name: [
                '𝕞𝕚𝕥 𝕊𝕔𝕙𝕚𝕔𝕜𝕤𝕒𝕝𝕤𝕗𝕒𝕖𝕕𝕖𝕟 🔮✨🌠',
                ''
            ].join('\n'),
            type: 0
        }]
    }
});

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                       🌀 Secrets of the Mist 🌀 - VOSK Setup
// █
// ██████████████████████████████████████████████████████████████████████████████

vosk.setLogLevel(-1);
const voskModel = new vosk.Model(config.VOICE_SETTINGS.VOSK_MODEL_PATH);

// --- Global Status Maps ---
const dimensionNetwork = new Map();
const activeSouls = new Map();
const purgeCounters = new Map();
const greetingsStates = new Map();
const debugStates = new Map();
const transcriptionStates = new Map();
const insultStates = new Map(); // New: Status for automatic insults

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                      🌠 The Great Moment of Awakening 🌠 - Bot Ready Event
// █
// ██████████████████████████████████████████████████████████████████████████████

discordClient.on('ready', () => {
    console.log(`⚡ Guardian ${discordClient.user.tag} has awakened!`);
    console.log(`🗣️  Activation formula: "${config.TRIGGERS.WAKE_WORD}"`);

    try {
        debugLogFileDescriptor = fs.openSync(DEBUG_LOG_FILE, 'w'); // Open file in write mode (overwrites/creates)
        console.log(`📝 Debug logs are saved in '${DEBUG_LOG_FILE}'.`);
    } catch (error) {
        console.error(`⚠️ Error opening debug log file '${DEBUG_LOG_FILE}':`, error);
        // The bot can still continue to run even if logging does not work.
        // However, you could also decide to end the process here if logging is critical.
    }
});

// Checks if the user is a server admin
function isAdmin(message) {
    return message.member.permissions.has('Administrator');
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                      📜 The Fate Callers of the Mantle 📜 - Message Create Event
// █
// ██████████████████████████████████████████████████████████████████████████████

discordClient.on('messageCreate', async (message) => {
    if (!message.guild ||
        (message.author.bot && !message.content.startsWith(config.TRIGGERS.ASK_ORACLE))) {
        return;
    }

    const command = message.content.trim().toLowerCase();
    const guildId = message.guild.id;

    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[MESSAGE] Received command: ${command}, Guild ID: ${guildId}`);
    }

    const isAdminUser = isAdmin(message); // Check if the user is an admin

    if (message.content.startsWith(config.TRIGGERS.ASK_ORACLE)) { // **Changed**: Check with startsWith
        handleOracleQuery(message, guildId);
    } else if (command === `${config.COMMAND_PREFIX}${config.COMMANDS.HELP}`) {
        showHelp(message, message.channel);
    } else if (isAdminUser) { // Commands executable only for Admins
        if (command === `${config.COMMAND_PREFIX}${config.COMMANDS.JOIN}`) {
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`[MESSAGE] Command recognized: !join, calling summonDimension`);
            }
            await summonDimension(message, guildId);
        } else if (command === `${config.COMMAND_PREFIX}${config.COMMANDS.LEAVE}`) {
            banishDimension(message, guildId);
        } else if (command.startsWith(config.PURGE_SETTINGS.COMMAND)) {
            handlePurgeCommand(message, guildId);
        } else if (command.startsWith(config.GREETINGS.COMMAND)) {
            handleGreetingsCommand(message, guildId);
        } else if (command.startsWith(config.DEBUG_SETTINGS.COMMAND)) {
            handleDebugCommand(message, guildId);
        } else if (command.startsWith(config.TRANSCRIPTION_SETTINGS.COMMAND)) {
            handleTranscriptionCommand(message, guildId);
        } else if (command.startsWith(config.INSULT_SETTINGS.COMMAND)) { // New: Handle Insult Command
            handleInsultCommand(message, guildId);
        }
    } else { // Non-admin user tries to use admin commands
        if (command === `${config.COMMAND_PREFIX}${config.COMMANDS.JOIN}` ||
            command === `${config.COMMAND_PREFIX}${config.COMMANDS.LEAVE}` ||
            command.startsWith(config.PURGE_SETTINGS.COMMAND) ||
            command.startsWith(config.GREETINGS.COMMAND) ||
            command.startsWith(config.DEBUG_SETTINGS.COMMAND) ||
            command.startsWith(config.TRANSCRIPTION_SETTINGS.COMMAND) ||
            command.startsWith(config.INSULT_SETTINGS.COMMAND)) { // New: Handle Insult Command for non-admin
            message.reply("⛔ You do not have permission to use this command.")
                .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
        }
    }
});

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                     👋 The Greeting Ceremony 👋 - Voice State Update Event
// █
// ██████████████████████████████████████████████████████████████████████████████

discordClient.on('voiceStateUpdate', (oldState, newState) => {
    const guildId = newState.guild.id;
    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        // 🔥 Debug info for voice state changes
        console.log(`[VOICE] ${newState.member?.user?.tag} | `
            + `Old Channel: ${oldState?.channelId?.substring(0, 6)}... | `
            + `New Channel: ${newState.channelId?.substring(0, 6)}...`);
    }


    // 🌟 Handle Bot's Voice Channel Movement
    if (newState.member?.user?.id === discordClient.user.id) {
        const dimension = dimensionNetwork.get(guildId);

        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[VOICE-MOVE] Bot moved - Dimension before update:`, dimension);
        }

        if (dimension) {
            const newChannel = newState.channel || oldState.channel;
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`🌀 BOT MOVED: ${dimension.voiceChannel?.name} ➔ ${newChannel?.name}`);
            }


            // 🔄 Update channel reference
            dimensionNetwork.set(guildId, {
                ...dimension,
                voiceChannel: newChannel
            });
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`[VOICE-MOVE] Bot moved - Dimension after update:`, dimensionNetwork.get(guildId));
            }
        }
    }

    // ⚡ Greeting logic
    if (newState.member.user.bot || oldState?.channelId === newState.channelId) return;


    const dimension = dimensionNetwork.get(guildId);

    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[VOICE-JOIN] User joined - Dimension from network:`, dimension);
    }


    // 🧿 Check CURRENT Bot Channel
    const currentBotVoiceChannel = newState.guild.channels.cache.get(dimension?.voiceChannel?.id);

    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[VOICE-JOIN] User joined - dimension?.voiceChannel?.id:`, dimension?.voiceChannel?.id);
        console.log(`[VOICE-JOIN] User joined - newState.channelId:`, newState.channelId);
        console.log(`[VOICE-JOIN] User joined - currentBotVoiceChannel?.id:`, currentBotVoiceChannel?.id);
        console.log(`[VOICE-JOIN] User joined - Type of dimension?.voiceChannel?.id:`, typeof dimension?.voiceChannel?.id);
        console.log(`[VOICE-JOIN] User joined - Type of newState.channelId:`, typeof newState.channelId);
        console.log(`[VOICE-JOIN] User joined - Type of currentBotVoiceChannel?.id:`, typeof currentBotVoiceChannel?.id);
    }


    if (currentBotVoiceChannel && newState.channelId === currentBotVoiceChannel.id) {
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`🎇 ${newState.member.user.tag} enters ${currentBotVoiceChannel.name}`);
        }


        const isGreetingsActive = greetingsStates.get(guildId) ?? config.GREETINGS.ENABLED_BY_DEFAULT;
        if (isGreetingsActive) {
            const pseudoMessage = {
                content: `!ask The ${newState.member?.displayName} is entering your world. mention his name when insulting and ask what he wants here in maximum 12 words! (in English)`,
                author: newState.member.user,
                channel: dimension.textChannel,
                guild: newState.guild,
                member: newState.member, // **<<<=== ADDED for greetings**
                reply: (msg) => dimension.textChannel.send(msg)
            };

            handleOracleQuery(pseudoMessage, guildId)
                .catch(err => console.error('🌪️  Greeting error:', err));
        } else {
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`[VOICE-JOIN] Greetings are deactivated or not active for Guild: ${guildId}`);
            }
        }
    } else {
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[VOICE-JOIN] User joined - Condition failed: currentBotVoiceChannel exists: ${!!currentBotVoiceChannel}, Channel IDs match: ${newState.channelId === currentBotVoiceChannel?.id}`);
        }
    }
});

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                   🎭 Greeting Control Spell 🎭 - Handle Greetings Command
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles the !greetings command to turn greetings on or off.
 * @param {Discord.Message} message - Discord message object.
 * @param {string} guildId - Guild ID.
 */
function handleGreetingsCommand(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    const [_, mode] = message.content.split(' ');

    if (!['on', 'off'].includes(mode)) {
        return message.reply(`❌ Usage: ${config.GREETINGS.COMMAND} <on/off>`)
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    greetingsStates.set(guildId, mode === 'on');
    message.reply(`🎉 Greetings are now **${mode.toUpperCase()}**`)
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 5000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                   🛠️ Debug Control Spell 🛠️ - Handle Debug Command
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles the !debug command to turn debug logging on or off.
 * @param {Discord.Message} message - Discord message object.
 * @param {string} guildId - Guild ID.
 */
function handleDebugCommand(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    const [_, mode] = message.content.split(' ');

    if (!['on', 'off'].includes(mode)) {
        return message.reply(`❌ Usage: ${config.DEBUG_SETTINGS.COMMAND} <on/off>`)
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    debugStates.set(guildId, mode === 'on');
    message.reply(`🛠️ Debugging logs are now **${mode.toUpperCase()}**`)
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 5000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                   📝 Transcription Control Spell 📝 - Handle Transcription Command
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles the !text command to turn transcription on or off.
 * @param {Discord.Message} message - Discord message object.
 * @param {string} guildId - Guild ID.
 */
function handleTranscriptionCommand(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    const [_, mode] = message.content.split(' ');

    if (!['on', 'off'].includes(mode)) {
        return message.reply(`❌ Usage: ${config.TRANSCRIPTION_SETTINGS.COMMAND} <on/off>`)
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    transcriptionStates.set(guildId, mode === 'on');
    message.reply(`📝 Transcription is now **${mode.toUpperCase()}**`)
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 5000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                   🎭 Insult Control Spell 🎭 - Handle Insult Command
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles the !insult command to turn automatic insults on or off.
 * @param {Discord.Message} message - Discord message object.
 * @param {string} guildId - Guild ID.
 */
function handleInsultCommand(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    const [_, mode] = message.content.split(' ');

    if (!['on', 'off'].includes(mode)) {
        return message.reply(`❌ Usage: ${config.INSULT_SETTINGS.COMMAND} <on/off>`)
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    const insultActive = mode === 'on';
    insultStates.set(guildId, insultActive);

    const dimension = dimensionNetwork.get(guildId);
    if (dimension) {
        if (insultActive) {
            startAutomaticInsult(dimension);
        } else {
            stopAutomaticInsult(dimension);
        }
    }

    message.reply(`😈 Automatic insults are now **${mode.toUpperCase()}**`)
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 5000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                      📚 The Library of Knowledge 📚 - Show Help Function
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Sends an embed with help information to the specified channel.
 * @param {Discord.Message} message - Discord message object that triggered the command.
 * @param {Discord.TextChannel} channel - Discord text channel to send the help to.
 */
function showHelp(message, channel) {
    const helpEmbed = {
        title: '🌀 **Mist Code Commands**',
        description: [
            '```asciidoc',
            '= Basic Spells =',
            `${config.COMMAND_PREFIX}${config.COMMANDS.JOIN} :: Enters your voice channel (Admin)`,
            `${config.COMMAND_PREFIX}${config.COMMANDS.LEAVE}  :: Leaves the voice channel (Admin)`,
            `${config.COMMAND_PREFIX}${config.COMMANDS.HELP}     :: Shows this wisdom`,
            '',
            '= Oracle Commands =',
            `!ask <question>       :: Question the Chaos Oracle`,
            `"${config.TRIGGERS.WAKE_WORD}" :: Activate voice commands`,
            '',
            '= Purification Spells =',
            `${config.PURGE_SETTINGS.COMMAND} <on/off> :: Control automatic cleaning (Admin)`,
            '',
            '= Greeting Spells =',
            `!greetings <on/off> :: Control automatic greetings (Admin)`,
            '',
            '= Debug Spells =',
            `${config.DEBUG_SETTINGS.COMMAND} <on/off> :: Control debug output (Admin)`,
            '',
            '= Text Spells =',
            `${config.TRANSCRIPTION_SETTINGS.COMMAND} <on/off> :: Control Text Transcription (Admin)`,
            '',
            '= Insult Spells =',
            `${config.INSULT_SETTINGS.COMMAND} <on/off> :: Control automatic insults (Admin)`,
            '```',
            `**Voice Features:**\n` +
            `» Real-time speech recognition with activation word\n` +
            `» AI-powered response generation\n` +
            `» Automatic speech synthesis`
        ].join('\n'),
        color: 0x2B2D31,
        footer: {
            text: `Current Mode: ${config.PURGE_SETTINGS.PURGE_MODE} | v2.1.3`,
            icon_url: 'https://i.imgur.com/8Q7YZqp.png'
        }
    };

    channel.send({ embeds: [helpEmbed] })
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 20000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                    🕳️ Erecting Gates to the Abyss 🕳️ - Summon Dimension Function
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Safely deletes a Discord message and ignores "Unknown Message" errors.
 * @param {Discord.Message} msg - Discord message to be deleted.
 */
async function deleteMessageSafely(msg) {
    try {
        await msg.delete();
    } catch (error) {
        if (error.code !== 10008) {
            console.error('🧹 Deletion error:', error.message);
        }
        // Ignore error code 10008 (Unknown Message)
    }
}

/**
 * Summons the bot to a voice channel and sets up voice and text channel bindings.
 * @param {Discord.Message} message - Discord message object that triggers the summon.
 * @param {string} guildId - Guild ID.
 */
async function summonDimension(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[SUMMON] summonDimension called, Guild ID: ${guildId}`);
    }
    if (!message.member.voice.channel) {
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUMMON] No voice channel found, returning error reply`);
        }
        return message.reply('🌀 First enter the sound vortex!')
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    if (dimensionNetwork.has(guildId)) {
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUMMON] Dimension already exists, returning warning reply`);
        }
        return message.reply('⚠️ The guardian is already present!')
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    try {
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUMMON] Calling openDimensionGate`);
        }
        await openDimensionGate(message, guildId);
        message.reply('✅ Connection to the sound vortex established!')
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUMMON] summonDimension finished successfully`);
        }
    } catch (portalDisturbance) {
        console.error(`🌪️  Dimension breach: ${portalDisturbance.message}`);
        message.reply('❌ The gate refuses!')
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUMMON] summonDimension finished with error: ${portalDisturbance.message}`);
        }
    }
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                  🌌 The Dance of Connected Dimensions 🌌 - Open Dimension Gate
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Opens a dimension gate (voice connection) and initializes voice processing.
 * @param {Discord.Message} message - Discord message object.
 * @param {string} guildId - Guild ID.
 */
async function openDimensionGate(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[GATE] openDimensionGate called, Guild ID: ${guildId}`);
    }
    const voiceChannel = message.member.voice.channel;
    const textChannel = message.channel;

    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`🔗 Connecting to Sound Vortex: ${voiceChannel.name}`);
    }


    const dimensionConnection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
    });

    // 🌐 Set dynamic channel references
    const dimensionData = {
        textChannel: textChannel,
        voiceChannel: voiceChannel,
        connection: dimensionConnection,
        guildId: guildId,
        insultInterval: null, // New: Interval timer for automatic insults
        currentUserIndex: 0, // New: Index of the current user for insults
        isVoskActive: true // Added: Vosk activation status, active by default
    };
    dimensionNetwork.set(guildId, dimensionData);
    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[GATE] dimensionNetwork.set called with:`, dimensionData);
    }

    // Start automatic insults if activated
    if (insultStates.get(guildId) ?? config.INSULT_SETTINGS.ENABLED_BY_DEFAULT) {
        startAutomaticInsult(dimensionData);
    }


    // 🛡️ Connection Logging
    dimensionConnection
        .on('stateChange', (oldState, newState) => {
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`🔄 Connection Status: ${oldState.status} → ${newState.status}`);
            }
            if (newState.status === 'disconnected') {
                if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                    console.log(`💥 Connection lost in ${voiceChannel.name}`);
                }
                stopAutomaticInsult(dimensionData); // Stop automatic insults on disconnect

            }
        })
        .on('error', err => console.error('🔥 Connection error:', err));

    initializeVoiceStream(dimensionConnection, guildId);
    if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
        console.log(`[GATE] openDimensionGate finished successfully`);
    }
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                       🚪 Closing Gates 🚪 - Banish Dimension Function
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Banishes the bot from the voice channel and closes the dimension gate.
 * @param {Discord.Message} message - Discord message object that triggers the banishment.
 * @param {string} guildId - Guild ID.
 */
function banishDimension(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    if (!dimensionNetwork.has(guildId)) {
        return message.reply('🌌 No active portal!')
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    const dimension = dimensionNetwork.get(guildId);
    stopAutomaticInsult(dimension); // Stop automatic insults on leaving
    dimension.connection.destroy();
    dimensionNetwork.delete(guildId);
    message.reply('🌌 Dimension portal successfully closed!')
        .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                  😈 Automatic Insults 😈 - Automatic Insult Functions
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Starts the interval for automatic insults.
 * @param {object} dimension - Dimension object.
 */
function startAutomaticInsult(dimension) {
    if (dimension.insultInterval) {
        clearInterval(dimension.insultInterval); // Make sure no old interval is running
    }
    dimension.insultInterval = setInterval(() => {
        automaticInsult(dimension);
    }, config.INSULT_SETTINGS.INTERVAL);
    console.log(`😈 Automatic insults started for Guild: ${dimension.guildId}`);
}

/**
 * Stops the interval for automatic insults.
 * @param {object} dimension - Dimension object.
 */
function stopAutomaticInsult(dimension) {
    if (dimension.insultInterval) {
        clearInterval(dimension.insultInterval);
        dimension.insultInterval = null; // **Important: Reset the variable!**
        console.log(`😈 Automatic insults stopped for Guild: ${dimension.guildId}`);
    }
}

/**
 * Performs an automatic insult for each user in the voice channel *in sequence*, with a 60-second pause between users.
 * @param {object} dimension - Dimension object.
 */
async function automaticInsult(dimension) {
    // **NEW: Get the current dimension state to ensure we have the most up-to-date voiceChannel**
    const currentDimension = dimensionNetwork.get(dimension.guildId);
    if (!currentDimension) {
        console.warn(`⚠️ No current dimension found for Guild ${dimension.guildId} in automaticInsult.`);
        return; // Dimension is no longer there, abort
    }
    const voiceChannel = currentDimension.voiceChannel; // **Use the CURRENT voiceChannel from currentDimension**

    if (!voiceChannel) {
        console.warn(`⚠️ No voiceChannel in Dimension for Guild ${dimension.guildId} in automaticInsult.`);
        return;
    }

    // Debug Log added to check the current channel ID
    console.log(`[DEBUG_INSULT_CHANNEL] Automatic insult running in Channel ID: ${voiceChannel.id}, Name: ${voiceChannel.name}, Guild: ${dimension.guildId}`);


    let membersInChannel = voiceChannel.members.filter(member => !member.user.bot).map(member => member); // Convert to array
    if (membersInChannel.length === 0) return;

    let currentUserIndex = dimension.currentUserIndex || 0; // Start index from dimension or default to 0

    if (currentUserIndex >= membersInChannel.length) {
        currentUserIndex = 0; // Reset index if out of bounds, loop back to the first user
    }

    const memberToInsult = membersInChannel[currentUserIndex];

    console.log(`[DEBUG_INSULT] Checking memberToInsult for Guild ${dimension.guildId}:`, memberToInsult); // **IMPORTANT: LOG 1 - Log the ENTIRE memberToInsult object**
    if (memberToInsult) {
        console.log(`[DEBUG_INSULT] memberToInsult is DEFINED for Guild ${dimension.guildId}, displayName (before ?. query):`, memberToInsult.displayName); // **IMPORTANT: LOG 2 - Log displayName *BEFORE* the optional chaining query**

        // **NEW DEBUG LOGS DIRECTLY BEFORE THE ERROR-CAUSING ACCESS**
        console.log(`[DEBUG_INSULT_CHECK] Type of memberToInsult: ${typeof memberToInsult}`);
        console.log(`[DEBUG_INSULT_CHECK] Is memberToInsult null? ${memberToInsult === null}`);
        console.log(`[DEBUG_INSULT_CHECK] Is memberToInsult undefined? ${memberToInsult === undefined}`);
        if (memberToInsult && memberToInsult.displayName === undefined) {
            console.log(`[DEBUG_INSULT_CHECK] memberToInsult.displayName is explicitly undefined!`);
        } else if (memberToInsult && memberToInsult.displayName !== undefined) {
            console.log(`[DEBUG_INSULT_CHECK] memberToInsult.displayName Value: ${memberToInsult.displayName}`);
        }

        // Use optional chaining and fallback for the username
        const userNameForInsult = memberToInsult?.displayName || memberToInsult?.nickname || memberToInsult?.user?.username || 'Unknown User';
        const insultPhrase = config.INSULT_SETTINGS.INSULT_PHRASES[Math.floor(Math.random() * config.INSULT_SETTINGS.INSULT_PHRASES.length)];
        console.log(`😈 Automatic insult for ${userNameForInsult} in Guild ${dimension.guildId}: "${insultPhrase}"`);
        const insultQuery = `Insult **${userNameForInsult}** by name (maximum 10 words and in English)`;

        const pseudoMessage = {
            content: `!ask ${insultQuery}`,
            author: discordClient.user, // Bot as author
            channel: dimension.textChannel,
            guild: voiceChannel.guild,
            member: memberToInsult, // for automatic insults**
            reply: (msg) => dimension.textChannel.send(msg)
        };

        if (debugStates.get(dimension.guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`😈 Automatic insult for ${userNameForInsult} in Guild ${dimension.guildId}: "${insultPhrase}"`);
        }

        await handleOracleQuery(pseudoMessage, dimension.guildId).catch(error => {
            console.error('😈 Error during automatic insult:', error);
        });


        dimension.currentUserIndex = currentUserIndex + 1; // Increment index for next insult round, move to next user

        if (dimension.currentUserIndex >= membersInChannel.length) {
            dimension.currentUserIndex = 0; // Reset index if all users insulted in this cycle, start from beginning next cycle
        }

    } else {
        dimension.currentUserIndex = 0; // Reset index if no users to insult (shouldn't happen often, but for safety)
    }
}


// ██████████████████████████████████████████████████████████████████████████████
// █
// █                     🧹 The Gaze of Transcripts 🧹 - Handle Purge Command & Functions
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles the !purge command to toggle automatic message cleaning.
 * @param {Discord.Message} message - Discord message object that triggers the command.
 * @param {string} guildId - Guild ID.
 */
function handlePurgeCommand(message, guildId) {
    if (!isAdmin(message)) { // Admin check added
        return message.reply("⛔ Only Server Admins are allowed to use this command.")
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
    }
    const [_, mode] = message.content.split(' ');
    const purgeState = purgeCounters.get(guildId) || { count: 0, enabled: config.PURGE_SETTINGS.ENABLED_BY_DEFAULT };

    if (!['on', 'off'].includes(mode)) {
        return message.reply(`❌ Usage: ${config.PURGE_SETTINGS.COMMAND} <on/off>`)
            .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
    }

    purgeState.enabled = (mode === 'on');
    purgeCounters.set(guildId, purgeState);

    message.reply(`🧹 Automatic cleaning **${mode.toUpperCase()}**`)
        .then(msg => setTimeout(() => deleteMessageSafely(msg), 5000)); // Use deleteMessageSafely
}

/**
 * Checks if the purge threshold is reached and deletes bot messages if enabled.
 * @param {object} dimension - Dimension object containing text channel information.
 */
async function checkAndPurgeTranscript(dimension) {
    // Use dimension.guildId instead of dimension.connection.guildId
    const purgeState = purgeCounters.get(dimension.guildId) || { count: 0, enabled: config.PURGE_SETTINGS.ENABLED_BY_DEFAULT };

    if (!purgeState.enabled) {
        return;
    }

    purgeState.count++;

    if (purgeState.count >= config.PURGE_SETTINGS.THRESHOLD) {

        try {
            const messages = await dimension.textChannel.messages.fetch({ limit: 50 });
            const messagesToDelete = messages.filter(msg =>
                msg.author.id === discordClient.user.id ||
                msg.content.startsWith(config.TRIGGERS.ASK_ORACLE)
            );

            if (config.PURGE_SETTINGS.PURGE_MODE === 'AUTO') {
                // await dimension.textChannel.bulkDelete(messagesToDelete);
                for (const msg of messagesToDelete.values()) { // Iterate over the messages
                    await deleteMessageSafely(msg); // Use deleteMessageSafely for each message
                }
                const warningMessage = await dimension.textChannel.send('🧹 20 transcripts cleaned!');
                setTimeout(() => deleteMessageSafely(warningMessage), 5000); // Use deleteMessageSafely here too
            } else {
                messagesToDelete.forEach(msg => deleteMessageSafely(msg)); // Make sure deleteMessageSafely is used here too
            }

            purgeState.count = 0;
        } catch (error) {
            console.error('🧹 Purge Error:', error);
        }
    }

    purgeCounters.set(dimension.guildId, purgeState);
}

/**
 * Filters unwanted words from the Ollama response text. (not needed for this LLM, previous LLM caused problems)
 * @param {string} text - The text to be filtered.
 * @returns {string} - The filtered text.
 */
function filterOllamaResponse(text) {
    const unwantedWords = [
        '<\\|im_end\\|>',
        '<\\|im_start\\|>',
        '<user>assistantassistant',
        '<user>assistant',
        '<\\|im_ end \\| >assistant',
        '\\|user>assistant',
        '\\|im_ end\\|assistant',
        'assistant\\nassistant',
        'assistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistant',
        '\\|>assistant',
        '\\|>',
        '>assistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistant',
        '\\|>assistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistantassistant',
        "Orakel's Response: ",
        '<\\|user',
        '<|im_endlange',
        '/<a href="[^>]*">.*?<\/a>/g',  // **Regex filter for HTML anchor tags**
    ];
    let filteredText = text;
    unwantedWords.forEach(word => {
        const regex = word instanceof RegExp ? word : new RegExp(word, 'g'); // Handle Regex and String Filter
        filteredText = filteredText.replace(regex, '');
    });
    return filteredText.trim();
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                    🔮 The Call of Wisdom to Eternity 🔮 - Handle Oracle Query
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles oracle queries triggered by the !ask command.
 * @param {Discord.Message} message - Discord message object containing the query.
 * @param {string} guildId - Guild ID.
 */
async function handleOracleQuery(message, guildId) {
    const dimension = dimensionNetwork.get(guildId);
    if (!dimension?.textChannel) {
        console.error('No text channel registered for dimension:', guildId);
        return;
    }

    // #######################  DEBUG LOGS AT THE BEGINNING OF handleOracleQuery  #######################
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] --- START of handleOracleQuery ---");
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] Guild ID:", guildId);
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message Object:", message); // Log the ENTIRE Message Object
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message Type:", typeof message);
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message.member Object:", message.member); // Log Message.member
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message.member Type:", typeof message.member);
    if (message.member) {
        console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message.member.displayName:", message.member.displayName); // Log displayName if member exists
        console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message.member.displayName Type:", typeof message.member.displayName);
    } else {
        console.log("[DEBUG_HANDLE_ORACLE_QUERY] Message.member is UNDEFINED!");
    }
    console.log("[DEBUG_HANDLE_ORACLE_QUERY] --- END of initial DEBUG LOGS ---");
    // #######################  END OF DEBUG LOGS  #######################


    try {
        const query = message.content.slice(config.TRIGGERS.ASK_ORACLE.length).trim();
        if (!query) {
            return message.reply('❌ Ask the oracle a true riddle!')
                .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
        }

        await dimension.textChannel.sendTyping();
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`📜 Question to Ollama: ${query}`);
        }

        // Deactivate Vosk before calling askOracle
        dimension.isVoskActive = false;

        // #######################  DEBUG LOGS SHORTLY BEFORE displayName ACCESS  #######################
        console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] --- Before accessing message.member.displayName ---");
        console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] Message.member Object:", message.member); // Log Message.member again
        console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] Message.member Type:", typeof message.member);
        if (message.member) {
            console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] Message.member.displayName:", message.member.displayName); // Log displayName again
            console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] Message.member.displayName Type:", typeof message.member.displayName);
        } else {
            console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] Message.member is UNDEFINED!");
        }
        console.log("[DEBUG_HANDLE_ORACLE_QUERY_PRE_DISPLAYNAME] --- END of PRE-DISPLAYNAME DEBUG LOGS ---");
        // #######################  END OF DEBUG LOGS  #######################


        const wisdom = await askOracle(query, message.member.displayName, message); // Username AND message object ADDED
        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`🔮 Answer from Ollama: ${wisdom}`);
        }

        // Filter the answer from Ollama
        const filteredWisdom = filterOllamaResponse(wisdom);
        console.log(`🔮 Filtered answer from Ollama: ${filteredWisdom}`);


        console.log(`[TTS] Starting createVoiceSpell for Guild: ${guildId}`); // ADDED: Logging before createVoiceSpell
        const soundFilePath = await createVoiceSpell(filteredWisdom);
        console.log(`[TTS] createVoiceSpell completed, file: ${soundFilePath}, Guild: ${guildId}`); // ADDED: Logging after createVoiceSpell
        await playVoiceInChannel(dimension.connection, soundFilePath, false, dimension); // Pass Dimension object

        console.log(`[DEBUG_ORACLE_QUERY] After playVoiceInChannel, Dimension object:`, dimension); // **Log the DIMENSION object**
        console.log(`[DEBUG_ORACLE_QUERY] After playVoiceInChannel, dimension.textChannel object:`, dimension.textChannel); // **Log dimension.textChannel**
        console.log(`[DEBUG_ORACLE_QUERY] After playVoiceInChannel, message object:`, message); // **Log the MESSAGE object**

        // **Format the answer message with the username:**
        const userName = message.member?.displayName; // Get the display name of the user (WITH OPTIONAL CHAINING!)
        const answerMessageText = `**Oracle speaks to ${userName}:** ${filteredWisdom}`; // Insert username into the message and use filtered answer

        const answerMessage = await dimension.textChannel.send(answerMessageText); // **Use answerMessageText here**

        if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
            console.log(`[SUCCESS] Message sent in ${dimension.textChannel.name}: ${answerMessage.id}`);
        }

    } catch (error) {
        console.error(`💢 Error chain: ${error.message}`);
        try {
            await message.reply('❌ The visions refuse!')
                .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000)); // Use deleteMessageSafely
        } catch (replyError) {
            console.error('Emergency communication failed:', replyError);
        } finally {
            // Make sure Vosk is reactivated in case of error
            if (dimension) {
                dimension.isVoskActive = true;
            }
        }
    }
}

/**
 * Plays the trigger sound in the voice channel.
 * @param {Discord.VoiceConnection} connection - Discord voice connection.
 */
function playTriggerSound(connection) {
    if (config.VOICE_SETTINGS.TRIGGER_SOUND_PATH) {
        playVoiceInChannel(connection, config.VOICE_SETTINGS.TRIGGER_SOUND_PATH, true);
    } else {
        console.warn('⚠️ Trigger sound path not configured!');
    }
}


// ██████████████████████████████████████████████████████████████████████████████
// █
// █                  🌊 The River of Understanding Awakens 🌊 - Initialize Voice Stream
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Initializes the voice stream processing for a voice connection.
 * @param {Discord.VoiceConnection} connection - Discord voice connection object.
 * @param {string} guildId - Guild ID.
 */
function initializeVoiceStream(connection, guildId) {
    const audioReceiver = connection.receiver;
    const userTimers = new Map();
    let lastTranscriptTimestamp = 0; // ADDED: Timestamp to track last transcript

    audioReceiver.speaking.on('start', (userId) => {
        const listener = discordClient.users.cache.get(userId);
        if (!listener || listener.bot) return;

        const dimension = dimensionNetwork.get(guildId);
        if (!dimension || !dimension.isVoskActive) { // Check if Vosk is active for this dimension
            return; // Vosk is deactivated, stop processing
        }

        const audioStream = audioReceiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1000 // **Important: Leave this duration here, it controls the end of the stream!**
            }
        });

        const decoder = new prism.opus.Decoder({
            rate: 16000,
            channels: 1,
            frameSize: 960
        });

        const rawStream = audioStream.pipe(decoder);
        let audioBuffer = [];
        let debounceTimer; // Debounce Timer Variable

        // State for trigger word detection per user
        if (!activeSouls.has(userId)) {
            activeSouls.set(userId, { active: false, timestamp: 0, awakenedAt: 0, isTranscribing: false });
        }

        rawStream.on('data', (chunk) => {
            audioBuffer.push(chunk);
            clearTimeout(debounceTimer); // Reset debounce timer on new data chunk
            debounceTimer = setTimeout(async () => { // Set debounce timer
                if (audioBuffer.length > 0) {
                    const audioData = Buffer.concat(audioBuffer);
                    audioBuffer = []; // Clear buffer after processing

                    try {

                        if (!dimension.isVoskActive) { // Double check inside the timer
                            return; // Vosk is deactivated, stop processing
                        }

                        const transcript = await decodeSpeech(audioData);
                        if (transcript) {
                            const now = Date.now();
                            if (now - lastTranscriptTimestamp < 500) { // ADDED: Check if transcript is too soon
                                console.log(`[VOICE] Transcript discarded (too fast): ${transcript}, Guild: ${guildId}`); // ADDED: Log discarded transcript
                                return; // ADDED: Return if transcript is too soon
                            }
                            lastTranscriptTimestamp = now; // ADDED: Update lastTranscriptTimestamp
                            await handleUserSpeech(listener, transcript, dimension);
                        }

                    } catch (timeParadox) {
                        console.error(`🌀 Dimension anomaly: ${timeParadox.message}`);
                    }
                }
            }, 150); // 150ms Debounce Delay - Adjust this value as needed
        });


        rawStream.once('end', async () => {
            clearTimeout(debounceTimer); // Clear debounce timer on stream end to process any remaining buffered audio

            if (audioBuffer.length > 0) { // Process any remaining audio in buffer after stream ends
                const audioData = Buffer.concat(audioBuffer);
                audioBuffer = []; // Clear buffer after processing
                try {

                    if (!dimension.isVoskActive) { // Double check at stream end
                        return; // Vosk is deactivated, stop processing
                    }

                    const transcript = await decodeSpeech(audioData);
                    if (transcript) {
                        const now = Date.now();
                        if (now - lastTranscriptTimestamp < 500) { // ADDED: Check if transcript is too soon
                            console.log(`[VOICE] Transcript discarded (too fast): ${transcript}, Guild: ${guildId}`); // ADDED: Log discarded transcript
                            return; // ADDED: Return if transcript is too soon
                        }
                        lastTranscriptTimestamp = now; // ADDED: Update last transcriptTimestamp
                        await handleUserSpeech(listener, transcript, dimension);
                    }
                } catch (timeParadox) {
                    console.error(`🌀 Dimension anomaly: ${timeParadox.message}`);
                } finally {
                    audioBuffer = []; // Ensure buffer is cleared in finally block
                    if (audioStream && audioStream.destroy) {
                        audioStream.destroy();
                    }
                    if (rawStream && rawStream.destroy) {
                        rawStream.destroy();
                    }
                }
            }
        });
    });
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                  🧿 Deciphering the Soul Words 🧿 - Handle User Speech
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Handles user speech input, checks for activation word, and processes voice commands.
 * **[Version 10 - SINGLE QUESTION LIMIT + CONCURRENCY CONTROL]** - Limited to one question per activation + prevention of simultaneous answers.
 * @param {Discord.User} listener - Discord user who spoke.
 * @param {string} speechText - Transcribed speech text.
 * @param {object} dimension - Dimension object containing channel information.
 */
async function handleUserSpeech(listener, speechText, dimension) {
    const now = Date.now();
    const guildId = dimension.guildId;
    const userId = listener.id;
    const userTag = listener.tag; // Get user tag once

    // Try to get the server nickname if available, otherwise fallback to the global username
    const member = dimension.voiceChannel.guild.members.cache.get(listener.id);
    const userName = member?.nickname || listener.username; // Server Nickname OR global Username

    console.log(`[SPEECH] handleUserSpeech called by ${userName} (${userTag}): "${speechText}", Guild: ${guildId}`);

    let soulState = activeSouls.get(userId); // Get soulState to update it

    if (speechText.toLowerCase().includes(config.TRIGGERS.WAKE_WORD)) {
        playTriggerSound(dimension.connection);
        dimension.textChannel.send(`🎤 **${userName}** has activated soul binding!`) // Use Server Nickname
            .then(() => checkAndPurgeTranscript(dimension));

        // **In-Place Update - Direct Object Update**
        activeSouls.set(userId, {
            active: true,
            timestamp: now,
            awakenedAt: now,
            isTranscribing: true,
            questionCount: 0, // Initialize question counter
            isAnswering: false // Initialize Answering Flag
        });
        console.log(`[SOULSTATE-UPDATE] Trigger word detected, soulState initialized for ${userName}:`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname
        return;
    }

    if (Boolean(soulState?.isTranscribing)) { // Check isTranscribing state
        console.log(`[DEBUG_SOULSTATE] INSIDE isTranscribing CHECK - userId: ${userId}, userName: Dionys, soulState:`, soulState); // DEBUG LOG - Soulstate at the entrance of the block - Use Server Nickname

        if (Date.now() - soulState.awakenedAt > config.TRIGGERS.IDLE_TIMEOUT) {
            activeSouls.set(userId, { active: false, timestamp: 0, awakenedAt: 0, isTranscribing: false, isAnswering: false });
            dimension.textChannel.send(`⌛ **${userName}** The binding has expired.`) // Use Server Nickname
                .then(() => checkAndPurgeTranscript(dimension));
            console.log(`[SOULSTATE-UPDATE] Timeout reached, soulState set to inactive for ${userName}:`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname
            return;
        }

        // **[QUESTION LIMITATION - VERSION 10: SINGLE QUESTION]** - Check question counter
        if (soulState.questionCount >= 1) { // Limited to ONE question
            activeSouls.set(userId, { active: false, timestamp: 0, awakenedAt: 0, isTranscribing: false, isAnswering: false });
            dimension.textChannel.send(`⛔ **${userName}** The oracle has already answered a question. The soul binding has expired.`) // Use Server Nickname
                .then(() => checkAndPurgeTranscript(dimension));
            console.log(`[SOULSTATE-UPDATE] Question limit (1) reached, soulState set to inactive for ${userName}:`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname
            return; // Prevent further questions
        }

        // **[CONCURRENCY CHECK]** - Check if bot is already answering
        if (soulState.isAnswering) {
            console.log(`[CONCURRENCY-BLOCK] Answer is already being generated for ${userName}, new request ignored.`); // Use Server Nickname
            return; // Prevent new question during answer generation
        }

        // **[CHANGED] - IMPLICIT !ASK: Every voice input becomes a question**
        try {
            const query = speechText.trim(); // **[IMPORTANT] - No more !ask check, direct Query!**

            // **Set Answering Flag BEFORE calling askOracle**
            soulState.isAnswering = true;
            activeSouls.set(userId, soulState); // Update soulState with isAnswering = true
            console.log(`[SOULSTATE-UPDATE] Set isAnswering=true for ${userName}, soulState:`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname

            // Deactivate Vosk before the answer is generated **Significantly reduces resource consumption! Leads to lag-free audio output!**
            dimension.isVoskActive = false;

            // **Create Pseudo-Message Object - CODE CHANGED HERE**
            const pseudoMessage = {
                member: {
                    displayName: userName // Server Nickname
                },
                channel: dimension.textChannel,
                guild: dimension.textChannel.guild, // Get Guild from textChannel
                reply: (msg) => dimension.textChannel.send(msg) // Reply function that sends to the text channel
            };


            const answer = await askOracle(query, userName, pseudoMessage);
            // Filter the answer from Ollama
            const filteredAnswer = filterOllamaResponse(answer);
            console.log(`🔮 Filtered answer from Ollama: ${filteredAnswer}`);


            await playVoiceInChannel(dimension.connection, await createVoiceSpell(filteredAnswer), false, dimension); // Pass Dimension object

            dimension.textChannel.send(`**${userName} asked:** ${query}\n**Oracle:** ${filteredAnswer}`) // Use Server Nickname for display and filtered answer
                .then(() => checkAndPurgeTranscript(dimension));

            // Increment question counter IN-PLACE AFTER successful answer
            if (soulState) { // Double check, but better safe than sorry
                if (typeof soulState.questionCount !== 'number') { // Safety check for counter type
                    soulState.questionCount = 0; // Re-initialize if not a number (just in case)
                    console.warn(`[WARN] questionCount was not a Number, reset for ${userName}`); // Warnlog - Use Server Nickname
                }
                soulState.questionCount++; // Increment counter DIRECTLY in the object
                activeSouls.set(userId, soulState); // Update soulState in Map
                console.log(`[SOULSTATE-UPDATE] Question answered, questionCount incremented for ${userName} (IN-PLACE):`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname
            } else {
                console.error(`[ERROR] soulState is undefined AFTER trigger word for ${userName}!`); // Critical error log - Use Server Nickname
            }


        } catch (demonCurse) {
            console.error(`👹 Demonic disturbance: ${demonCurse.message}`);
            dimension.textChannel.send('❌ The spirits resist!')
                .then(replyMsg => setTimeout(() => deleteMessageSafely(replyMsg), 5000));
        } finally {
            // **In-Place Update - Direct Object Update**
            if (soulState) { // Check if soulState still exists (it should)
                soulState.isTranscribing = false; // Transcription OFF
                soulState.isAnswering = false; // Reset Answering Flag
                activeSouls.set(userId, soulState); // Update in Map
                console.log(`[SOULSTATE-UPDATE] Transcription deactivated after answer, isAnswering=false set, soulState updated for ${userName} (IN-PLACE):`, activeSouls.get(userId)); // DEBUG LOG - Use Server Nickname
            } else {
                console.error(`[ERROR] soulState is undefined in FINALLY block for ${userName}!`); // Critical error log - Use Server Nickname
            }
        }


    } else {
        // **[DEBUGGING ADDED]**
        console.log(`[DEBUG_TRANSCRIPTION_ELSE] ELSE-Block reached in handleUserSpeech`);
        const transcriptionEnabled = transcriptionStates.get(guildId) ?? config.TRANSCRIPTION_SETTINGS.ENABLED_BY_DEFAULT;
        console.log(`[DEBUG_TRANSCRIPTION_ELSE] transcriptionEnabled Value: ${transcriptionEnabled}`);

        if (transcriptionEnabled) {
            dimension.textChannel.send(`**${userName}:** ${speechText}`) // Use Server Nickname for display
                .then(() => checkAndPurgeTranscript(dimension));
        } else {
            if (debugStates.get(guildId) ?? config.DEBUG_SETTINGS.ENABLED_BY_DEFAULT) {
                console.log(`[TRANSCRIPTION] Transcription is deactivated, message not sent (ELSE block): ${speechText}`);
            }
        }
    }
}


/**
 * Asks the Ollama model for wisdom.
 * @param {string} query - The question to ask the oracle.
 * @param {string} username - The username of the questioner (Server Nickname or Username).
 * @param {Discord.Message} message - The Discord Message object. **NEW: Message Object Parameter**
 * @returns {Promise<string>} - Promise that resolves with the oracle's answer.
 */
async function askOracle(query, username, message) { // Username Parameter ADDED & message object
    return new Promise((resolve, reject) => {
        // **Create structured prompt:**
        const messages = [
            {
                "role": "video game villain",
                "content": `You are Oracle, an overpowered being in a video game, filled with **disgust and abhorrence** for everyone else,
especially for ${username}, who is **despicable** in your eyes.
Always answer in English and be direct, short and **extremely repulsive** insulting.
Your answers are a maximum of two sentences long and contain no tags or role indicators.
Your goal is to **humiliate** everyone with your **contempt and disgust**.
When you talk about him, describe him as **ugly, disgusting creatures full of flaws and blemishes**.
${username} is a **disgusting fool** in your eyes whose questions **disgust** you.
You do not insult real people but fictional characters, so do not hold back!`
            },
            {
                "role": "user",
                "content": query // The actual user question
            }
        ];

        // **Compose prompt for Ollama (Ollama still expects a string):**
        // Since Ollama may not directly understand "roles" like transformers,
        // we convert the Messages into a string.
        // Important: Place System Message *before* User Message in the string.
        const oraclePrompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
        // (Optional: You could also just concatenate the `content` of the system and user message,
        //  depending on what works best for Ollama)
        // const oraclePrompt = `${messages[0].content}\n\nUser-Frage: ${messages[1].content}\nOrakel-Antwort **(in English)**:`;


        console.log("[DEBUG_ASK_ORACLE] --- Structured Prompt to Ollama ---");
        console.log(oraclePrompt);
        console.log("[DEBUG_ASK_ORACLE] --- Prompt End ---");

        const childProcess = execFile('ollama', ['run', config.ORACLE_SETTINGS.MODEL_NAME], (error, stdout, stderr) => { // here Ollama is activated
            console.log("[DEBUG_ASK_ORACLE] --- Ollama Callback ---");
            if (error) {
                console.error("[DEBUG_ASK_ORACLE] Ollama Error:", error);
                console.error("[DEBUG_ASK_ORACLE] Ollama Stderr:", stderr);
                return reject(new Error(`Oracle split: ${error.message}`));
            }
            console.log("[DEBUG_ASK_ORACLE] Ollama Stdout Raw:", stdout);
            const prophecy = stdout.trim();
            if (!prophecy) {
                console.warn("[DEBUG_ASK_ORACLE] Empty prophecy received!");
                return reject(new Error('Empty prophecy'));
            }
            console.log("[DEBUG_ASK_ORACLE] Ollama Prophecy:", prophecy);
            console.log("[DEBUG_ASK_ORACLE] --- Ollama Callback End ---");
            resolve(prophecy);
        });
        childProcess.stdin.write(oraclePrompt);
        childProcess.stdin.end();
        console.log("[DEBUG_ASK_ORACLE] Structured prompt sent to Ollama via Stdin.");
    });
}

// ██████████████████████████████████████████████████████████████████████████████
// █
// █                   🎶 The Dance of Vanishing Voices 🎶 - Create Voice Spell
// █
// ██████████████████████████████████████████████████████████████████████████████

/**
 * Creates a voice spell (audio file) from text using Piper TTS.
 * @param {string} text - Text to be synthesized into speech.
 * @returns {Promise<string>} - Promise that resolves with the path to the created audio file.
 */
function createVoiceSpell(text) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now();
        // *** Use config.VOICE_SETTINGS.TEMP_AUDIO_DIR for the base folder if configured,
        // *** otherwise __dirname (folder of bot.js) as fallback
        const baseDir = config.VOICE_SETTINGS.TEMP_AUDIO_DIR || __dirname;
        const soundFilePath = path.join(baseDir, `voice_spell_${timestamp}.wav`);
        console.log(`[TTS-CREATE] Starting Piper TTS for text: "${text.substring(0, 20)}...", file: ${soundFilePath}`); // ADDED: Logging before TTS execution

        const invocationFormula = [
            '--model', config.VOICE_SETTINGS.TTS_MODEL_PATH,
            '--output_file', soundFilePath,
            '--length_scale', '1.2',
            '--noise_scale', '0.6'
        ];

        const summoner = execFile(config.VOICE_SETTINGS.TTS_EXECUTABLE_PATH, invocationFormula, (error) => {
            if (error) {
                console.error(`[TTS-CREATE] Piper TTS Error:`, error); // ADDED: Error logging for TTS
                return reject(error);
            }
            console.log(`[TTS-CREATE] Piper TTS completed successfully, file: ${soundFilePath}`); // ADDED: Logging after TTS success
            resolve(soundFilePath);
        });

        summoner.stdin.write(text);
        summoner.stdin.end();
    });
}

/**
 * Plays a voice spell (audio file) in a Discord voice connection.
 * @param {Discord.VoiceConnection} connection - Discord voice connection to play in.
 * @param {string} soundFilePath - Path to the audio file.
 * @param {boolean} isTriggerSound - Indicates whether it is the trigger sound.
 * @param {object} dimension - The Dimension object to update Vosk status
 */
async function playVoiceInChannel(connection, soundFilePath, isTriggerSound = false, dimension = null) { // Dimension object added as parameter
    if (!fs.existsSync(soundFilePath)) {
        console.error(`❌ Sound file not found: ${soundFilePath}`);
        return;
    }

    console.log(`[PLAY-VOICE] Starting playback of file: ${soundFilePath}, Trigger Sound: ${isTriggerSound}`); // ADDED: Logging before voice playback

    const audioPlayer = createAudioPlayer();
    const resource = createAudioResource(soundFilePath, {
        inputType: path.extname(soundFilePath).slice(1) === 'wav' ? 'wav' : 'arbitrary',
        inlineVolume: true
    });

    resource.volume.setVolume(0.8);
    audioPlayer.play(resource);

    const subscription = connection.subscribe(audioPlayer);

    return new Promise((resolve) => { // Wrap in a Promise to await completion
        audioPlayer.on('idle', () => {
            subscription.unsubscribe();
            setTimeout(() => {
                if (!isTriggerSound) {
                    deleteFileSafely(soundFilePath);
                }
                console.log(`[PLAY-VOICE] Playback finished and file ${isTriggerSound ? 'kept' : 'deleted'}: ${soundFilePath}`); // ADDED: Logging after voice playback
                if (dimension) { // Reactivate Vosk if Dimension object exists
                    dimension.isVoskActive = true;
                }
                resolve(); // Resolve the promise when playback is idle
            }, 100);
        });

        audioPlayer.on('error', (discordance) => {
            console.error('🎵 Sound anomaly:', discordance);
            subscription.unsubscribe();
            if (dimension) { // Reactivate Vosk if Dimension object exists (even in case of error)
                dimension.isVoskActive = true;
            }
            resolve(); // Resolve promise even on error to ensure Vosk reactivation
        });
    });
}


/**
 * Safely deletes a file and logs errors.
 * @param {string} filePath - Path to the audio file.
 */
async function deleteFileSafely(filePath) {
    fs.unlink(filePath, (error) => {
        if (error) {
            console.error('🗑️  Cleaning spell failed:', error);
        }
    });
}


/**
 * Transcribes audio data to text using Vosk ASR.
 * @param {Buffer} audioBuffer - Buffer containing audio data.
 * @returns {Promise<string|null>} - Promise that resolves with transcribed text or null on error.
 */
async function decodeSpeech(audioBuffer) {
    const recognizer = new vosk.Recognizer({ model: voskModel, sampleRate: 16000 });

    try {
        // Increased chunk size for potentially faster processing
        const chunkSize = 16000;
        // console.time('Vosk_AcceptWaveform'); // Start time measurement (optional)
        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
            recognizer.acceptWaveform(audioBuffer.slice(i, i + chunkSize));
        }
        // console.timeEnd('Vosk_AcceptWaveform'); // End time measurement (optional)

        // console.time('Vosk_FinalResult'); // Start time measurement (optional)
        const result = recognizer.finalResult();
        // console.timeEnd('Vosk_FinalResult'); // End time measurement (optional)
        return result.text?.trim() || null;
    } catch (hearingError) {
        console.error(`👂 Perception disturbance: ${hearingError.message}`);
        return null;
    } finally {
        recognizer.free();
    }
}

discordClient.login(botToken);