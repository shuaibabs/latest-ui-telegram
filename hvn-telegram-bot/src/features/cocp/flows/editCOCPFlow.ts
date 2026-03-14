import TelegramBot from 'node-telegram-bot-api';
import { getSession, setSession, clearSession } from '../../../core/bot/sessionManager';
import { logger } from '../../../core/logger/logger';
import { getCOCPDetails, updateCOCPDetails } from '../cocpService';
import { CommandRouter } from '../../../core/router/commandRouter';
import { getUserProfile, isAdmin } from '../../../core/auth/permissions';
import { parse, isValid } from 'date-fns';

const EDIT_STAGES = {
    AWAIT_MOBILE: 'AWAIT_MOBILE',
    AWAIT_DATE: 'AWAIT_DATE'
} as const;

type EditSession = {
    chatId: number;
    stage: keyof typeof EDIT_STAGES;
    mobile?: string;
};

const cancelBtn = { text: '❌ Cancel', callback_data: 'cocp_edit_cancel' };

export async function startEditCOCPFlow(bot: TelegramBot, chatId: number, username?: string) {
    const isUserAdmin = await isAdmin(username);
    const profile = await getUserProfile(username);
    if (!isUserAdmin && !profile?.displayName) {
        await bot.sendMessage(chatId, "❌ *Profile Incomplete*\n\nYour profile does not have a display name set in the system. Please contact an administrator.", { parse_mode: 'Markdown' });
        return;
    }

    setSession(chatId, 'cocpEdit', { stage: 'AWAIT_MOBILE', chatId });
    await bot.sendMessage(chatId, "✏️ *Edit Safe Custody Date*\n\nPlease enter the 10-digit mobile number:", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[cancelBtn]] }
    });
}

export function registerEditCOCPFlow(router: CommandRouter) {
    const bot = router.bot;

    bot.on('message', async (msg: TelegramBot.Message) => {
        const session = getSession(msg.chat.id, 'cocpEdit') as EditSession | undefined;
        if (!session || !msg.text || msg.text.startsWith('/')) return;

        const chatId = msg.chat.id;
        const text = msg.text.trim();

        if (session.stage === 'AWAIT_MOBILE') {
            if (!/^\d{10}$/.test(text)) {
                await bot.sendMessage(chatId, "❌ Invalid mobile number. Please enter a 10-digit number.");
                return;
            }

            try {
                const isUserAdmin = await isAdmin(msg.from?.username);
                const profile = await getUserProfile(msg.from?.username);
                const employeeName = isUserAdmin ? undefined : profile?.displayName;

                const num = await getCOCPDetails(text, employeeName);
                if (!num) {
                    await bot.sendMessage(chatId, `❌ No COCP record found for \`${text}\`${employeeName ? ` assigned to ${employeeName}` : ""}.`, { parse_mode: 'Markdown' });
                    clearSession(chatId, 'cocpEdit');
                    return;
                }

                session.mobile = text;
                session.stage = 'AWAIT_DATE';
                setSession(chatId, 'cocpEdit', session);

                await bot.sendMessage(chatId, `🏢 *Selected:* \`${text}\`\n\nPlease enter the new *Safe Custody Date* (DD/MM/YYYY):`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: [[cancelBtn]] }
                });
            } catch (error: any) {
                logger.error(`Error in editCOCPFlow (Mobile): ${error.message}`);
                await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
                clearSession(chatId, 'cocpEdit');
            }
        } else if (session.stage === 'AWAIT_DATE') {
            const dateStr = text;
            const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());

            if (!isValid(parsedDate)) {
                await bot.sendMessage(chatId, "❌ Invalid date format. Please use *DD/MM/YYYY* (e.g. 25/12/2024).", { parse_mode: 'Markdown' });
                return;
            }

            try {
                const creator = msg.from?.first_name + (msg.from?.last_name ? ' ' + msg.from?.last_name : '');
                await updateCOCPDetails(session.mobile!, { safeCustodyDate: parsedDate }, creator);

                await bot.sendMessage(chatId, `✅ *Updated!*\n\nSafe Custody Date for \`${session.mobile}\` has been set to ${dateStr}.`, { parse_mode: 'Markdown' });
                clearSession(chatId, 'cocpEdit');
            } catch (error: any) {
                await bot.sendMessage(chatId, `❌ Error updating date: ${error.message}`);
            }
        }
    });

    router.registerCallback('cocp_edit_cancel', async (query) => {
        clearSession(query.message!.chat.id, 'cocpEdit');
        await bot.sendMessage(query.message!.chat.id, "Operation cancelled.");
    });
}
