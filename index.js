// index.js
import { Client, GatewayIntentBits, Events, PermissionsBitField } from 'discord.js';
import 'dotenv/config';
import ms from 'ms'; // buat konversi durasi mute, install dulu: npm install ms

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on(Events.ClientReady, () => {
    console.log(`Bot online sebagai ${client.user.tag}`);
});

// ===== COMMAND MODERATION =====
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // ===== BAN =====
    if (command === '!ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply('Ga punya izin ban!');

        const target = message.mentions.members.first();
        const reason = args.join(' ') || 'Tidak ada alasan';
        if (!target) return message.reply('Tag member dulu!');

        try {
            await target.ban({ reason });

            // Notif ke channel log pakai ID
            const logChannel = message.guild.channels.cache.get('1455532472774426803');
            if (logChannel) {
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Ban
Target: ${target.user.tag}
Oleh: ${message.author.tag}
Alasan: ${reason}`);
            }

            // DM ke member
            try { await target.send(`Kamu kena ban karena: ${reason}`); } catch {}

        } catch (err) {
            message.reply('Gagal ban member ini.');
            console.error(err);
        }
    }

    // ===== KICK =====
    if (command === '!kick') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return message.reply('Ga punya izin kick!');

        const target = message.mentions.members.first();
        const reason = args.join(' ') || 'Tidak ada alasan';
        if (!target) return message.reply('Tag member dulu!');

        try {
            await target.kick(reason);

            const logChannel = message.guild.channels.cache.get('1455532472774426803');
            if (logChannel) {
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Kick
Target: ${target.user.tag}
Oleh: ${message.author.tag}
Alasan: ${reason}`);
            }

            try { await target.send(`Kamu kena kick karena: ${reason}`); } catch {}

        } catch (err) {
            message.reply('Gagal kick member ini.');
            console.error(err);
        }
    }

    // ===== MUTE =====
    if (command === '!mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply('Ga punya izin mute!');

        const target = message.mentions.members.first();
        const duration = args[1] || '10m'; // default 10 menit
        const reason = args.slice(2).join(' ') || 'Tidak ada alasan';
        if (!target) return message.reply('Tag member dulu!');

        try {
            const timeMs = ms(duration);
            await target.timeout(timeMs, reason);

            const logChannel = message.guild.channels.cache.get('1455532472774426803');
            if (logChannel) {
                logChannel.send(`🚨 Pelanggaran Terjadi
Action: Mute
Target: ${target.user.tag}
Oleh: ${message.author.tag}
Durasi: ${duration}
Alasan: ${reason}`);
            }

            try { await target.send(`Kamu kena mute selama ${duration} karena: ${reason}`); } catch {}

        } catch (err) {
            message.reply('Gagal mute member ini.');
            console.error(err);
        }
    }
});

// ===== LOGIN BOT =====
client.login(process.env.TOKEN);
