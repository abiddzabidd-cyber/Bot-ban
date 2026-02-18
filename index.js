// index.js
import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, PermissionsBitField, EmbedBuilder } from 'discord.js';
import 'dotenv/config';
import ms from 'ms';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const logChannelId = '1455532472774426803'; // channel log

// ===== REGISTER SLASH COMMANDS =====
const commands = [
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban member dari server')
        .addUserOption(option => option.setName('target').setDescription('Member yang akan diban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan ban')),
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick member dari server')
        .addUserOption(option => option.setName('target').setDescription('Member yang akan dikick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan kick')),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute member sementara')
        .addUserOption(option => option.setName('target').setDescription('Member yang akan dimute').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Durasi mute (contoh: 10m)'))
        .addStringOption(option => option.setName('reason').setDescription('Alasan mute'))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Mendaftarkan slash command...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Slash command berhasil didaftarkan!');
    } catch (err) {
        console.error(err);
    }
})();

// ===== READY =====
client.once('ready', () => {
    console.log(`Bot online sebagai ${client.user.tag}`);
});

// ===== INTERACTION HANDLER =====
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member } = interaction;
    const target = options.getUser('target');
    const reason = options.getString('reason') || 'Tidak ada alasan';

    const logChannel = guild.channels.cache.get(logChannelId);

    if (commandName === 'ban') {
        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return interaction.reply({ content: 'Ga punya izin ban!', ephemeral: true });
        const targetMember = guild.members.cache.get(target.id);

        try {
            await targetMember.ban({ reason });

            // log
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🚨 Pelanggaran Terjadi')
                    .setColor('#ff0000')
                    .addFields(
                        { name: 'Action', value: 'Ban', inline: true },
                        { name: 'Target', value: target.tag, inline: true },
                        { name: 'Oleh', value: member.user.tag, inline: true },
                        { name: 'Alasan', value: reason }
                    )
                    .setFooter({ text: 'Created by | Xyliq' })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }

            try { await target.send(`Kamu kena ban karena: ${reason}`); } catch {}

            await interaction.reply({ content: `${target.tag} berhasil diban!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal ban member ini.', ephemeral: true });
        }
    }

    if (commandName === 'kick') {
        if (!member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return interaction.reply({ content: 'Ga punya izin kick!', ephemeral: true });
        const targetMember = guild.members.cache.get(target.id);

        try {
            await targetMember.kick(reason);

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🚨 Pelanggaran Terjadi')
                    .setColor('#ff6600')
                    .addFields(
                        { name: 'Action', value: 'Kick', inline: true },
                        { name: 'Target', value: target.tag, inline: true },
                        { name: 'Oleh', value: member.user.tag, inline: true },
                        { name: 'Alasan', value: reason }
                    )
                    .setFooter({ text: 'Created by | Xyliq' })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }

            try { await target.send(`Kamu kena kick karena: ${reason}`); } catch {}

            await interaction.reply({ content: `${target.tag} berhasil dikick!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal kick member ini.', ephemeral: true });
        }
    }

    if (commandName === 'mute') {
        if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return interaction.reply({ content: 'Ga punya izin mute!', ephemeral: true });
        const targetMember = guild.members.cache.get(target.id);
        const duration = options.getString('duration') || '10m';
        const timeMs = ms(duration);

        try {
            await targetMember.timeout(timeMs, reason);

            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('🚨 Pelanggaran Terjadi')
                    .setColor('#ffff00')
                    .addFields(
                        { name: 'Action', value: 'Mute', inline: true },
                        { name: 'Target', value: target.tag, inline: true },
                        { name: 'Oleh', value: member.user.tag, inline: true },
                        { name: 'Durasi', value: duration, inline: true },
                        { name: 'Alasan', value: reason }
                    )
                    .setFooter({ text: 'Created by | Xyliq' })
                    .setTimestamp();
                logChannel.send({ embeds: [embed] });
            }

            try { await target.send(`Kamu kena mute selama ${duration} karena: ${reason}`); } catch {}

            await interaction.reply({ content: `${target.tag} berhasil dimute!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: 'Gagal mute member ini.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
