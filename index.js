// index.js
import 'dotenv/config';
import ms from 'ms';
import { Client, GatewayIntentBits, PermissionsBitField, REST, Routes, SlashCommandBuilder, Events } from 'discord.js';

// ===== CONFIG =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ===== REGISTER SLASH COMMANDS =====
const commands = [
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban member')
        .addUserOption(opt => opt.setName('target').setDescription('Member yang di-ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Alasan ban')),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick member')
        .addUserOption(opt => opt.setName('target').setDescription('Member yang di-kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Alasan kick')),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute member')
        .addUserOption(opt => opt.setName('target').setDescription('Member yang di-mute').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Durasi mute (ex: 10m, 1h)'))
        .addStringOption(opt => opt.setName('reason').setDescription('Alasan mute')),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Mendaftarkan slash command...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Slash command berhasil didaftarkan!');
    } catch (err) {
        console.error(err);
    }
})();

// ===== BOT READY =====
client.on(Events.ClientReady, () => {
    console.log(`Bot online sebagai ${client.user.tag}`);
});

// ===== SLASH COMMAND HANDLER =====
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, member, guild } = interaction;
    const logChannel = guild.channels.cache.get('1455532472774426803'); // ganti sesuai channel pelanggaran

    const target = options.getUser('target');
    const reason = options.getString('reason') || 'Tidak ada alasan';

    if (commandName === 'ban') {
        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({ content: 'Ga punya izin ban!', ephemeral: true });

        const targetMember = guild.members.cache.get(target.id);
        if (!targetMember) return interaction.reply({ content: 'Member ga ditemukan!', ephemeral: true });

        try {
            await targetMember.ban({ reason });

            if (logChannel)
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Ban
Target: ${target.tag}
Oleh: ${member.user.tag}
Alasan: ${reason}`);

            try { await target.send(`Kamu kena ban karena: ${reason}`); } catch {}

            interaction.reply({ content: `✅ ${target.tag} berhasil di-ban.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal ban member ini.', ephemeral: true });
        }
    }

    if (commandName === 'kick') {
        if (!member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return interaction.reply({ content: 'Ga punya izin kick!', ephemeral: true });

        const targetMember = guild.members.cache.get(target.id);
        if (!targetMember) return interaction.reply({ content: 'Member ga ditemukan!', ephemeral: true });

        try {
            await targetMember.kick(reason);

            if (logChannel)
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Kick
Target: ${target.tag}
Oleh: ${member.user.tag}
Alasan: ${reason}`);

            try { await target.send(`Kamu kena kick karena: ${reason}`); } catch {}

            interaction.reply({ content: `✅ ${target.tag} berhasil di-kick.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal kick member ini.', ephemeral: true });
        }
    }

    if (commandName === 'mute') {
        if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return interaction.reply({ content: 'Ga punya izin mute!', ephemeral: true });

        const targetMember = guild.members.cache.get(target.id);
        if (!targetMember) return interaction.reply({ content: 'Member ga ditemukan!', ephemeral: true });

        const duration = options.getString('duration') || '10m';
        const timeMs = ms(duration);

        try {
            await targetMember.timeout(timeMs, reason);

            if (logChannel)
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Mute
Target: ${target.tag}
Oleh: ${member.user.tag}
Durasi: ${duration}
Alasan: ${reason}`);

            try { await target.send(`Kamu kena mute selama ${duration} karena: ${reason}`); } catch {}

            interaction.reply({ content: `✅ ${target.tag} berhasil di-mute selama ${duration}.`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal mute member ini.', ephemeral: true });
        }
    }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
