import { db } from "./db";
import { vipPackages, videos, fundPlans } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

export async function seedDatabase() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_task_history_completed_at ON task_history(completed_at)',
    'CREATE INDEX IF NOT EXISTS idx_task_history_user_video_date ON task_history(user_id, video_id, completed_at)',
    'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id)',
    'CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id)',
    'CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status)',
    'CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON deposit_requests(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status)',
    'CREATE INDEX IF NOT EXISTS idx_balance_history_user_id ON balance_history(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_balance_history_created_at ON balance_history(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)',
    'CREATE INDEX IF NOT EXISTS idx_users_last_login_ip ON users(last_login_ip)',
    'CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_stajyor_requests_user_id ON stajyor_requests(user_id)',
  ];
  for (const idx of indexes) {
    await db.execute(sql.raw(idx));
  }

  const vipDefs = [
    { name: "Stajyor", price: "0", dailyTasks: 3, perVideoReward: "0.31", dailyEarning: "0.93", level: 0, durationDays: 3, isLocked: false, emoji: "\u{1F193}", description: "Boshlang'ich sinov davri" },
    { name: "M1", price: "27", dailyTasks: 5, perVideoReward: "0.20", dailyEarning: "1.00", level: 1, durationDays: 85, isLocked: true, emoji: "\u{1F947}", description: "Kuniga 5 ta video vazifa" },
    { name: "M2", price: "59", dailyTasks: 6, perVideoReward: "0.47", dailyEarning: "2.80", level: 2, durationDays: 85, isLocked: true, emoji: "\u{1F948}", description: "Kuniga 6 ta video vazifa" },
    { name: "M3", price: "159", dailyTasks: 8, perVideoReward: "1.00", dailyEarning: "8.00", level: 3, durationDays: 85, isLocked: true, emoji: "\u{1F949}", description: "Kuniga 8 ta video vazifa" },
    { name: "M4", price: "359", dailyTasks: 10, perVideoReward: "2.00", dailyEarning: "20.00", level: 4, durationDays: 85, isLocked: true, emoji: "\u{1F3C6}", description: "Kuniga 10 ta video vazifa" },
    { name: "M5", price: "759", dailyTasks: 15, perVideoReward: "3.00", dailyEarning: "45.00", level: 5, durationDays: 85, isLocked: true, emoji: "\u{1F31F}", description: "Kuniga 15 ta video vazifa" },
    { name: "M6", price: "1599", dailyTasks: 20, perVideoReward: "5.00", dailyEarning: "100.00", level: 6, durationDays: 85, isLocked: true, emoji: "\u{1F4AB}", description: "Kuniga 20 ta video vazifa" },
    { name: "M7", price: "3999", dailyTasks: 25, perVideoReward: "9.00", dailyEarning: "225.00", level: 7, durationDays: 85, isLocked: true, emoji: "\u{1F680}", description: "Kuniga 25 ta video vazifa" },
    { name: "M8", price: "8999", dailyTasks: 30, perVideoReward: "17.00", dailyEarning: "510.00", level: 8, durationDays: 85, isLocked: true, emoji: "\u{1F4E1}", description: "Kuniga 30 ta video vazifa" },
    { name: "M9", price: "19999", dailyTasks: 40, perVideoReward: "28.00", dailyEarning: "1120.00", level: 9, durationDays: 85, isLocked: true, emoji: "\u{1F30C}", description: "Kuniga 40 ta video vazifa" },
    { name: "M10", price: "55000", dailyTasks: 50, perVideoReward: "53.00", dailyEarning: "2650.00", level: 10, durationDays: 85, isLocked: true, emoji: "\u{1F451}", description: "Kuniga 50 ta video vazifa" },
  ];
  const existingVip = await db.select().from(vipPackages);
  for (const def of vipDefs) {
    const exists = existingVip.find(p => p.name === def.name);
    if (!exists) {
      await db.insert(vipPackages).values(def);
    } else {
      const { isLocked, ...updateFields } = def;
      await db.update(vipPackages).set(updateFields).where(eq(vipPackages.id, exists.id));
    }
  }
  console.log("VIP packages seeded (11 tiers)");

  const videoDefs = [
    { title: "Squid Game: Season 2", thumbnail: "https://img.youtube.com/vi/Ed1sGgHUo88/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=Ed1sGgHUo88", actors: "Lee Jung-jae, Wi Ha-jun, Gong Yoo", rating: "4.9", releaseDate: "2025-12-26", country: "Janubiy Koreya", duration: 25, reward: "0", category: "Tele-shou" },
    { title: "The Last of Us: Season 2", thumbnail: "https://img.youtube.com/vi/_zHPsmXCjB0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=_zHPsmXCjB0", actors: "Pedro Pascal, Bella Ramsey", rating: "4.8", releaseDate: "2026-04-13", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Wednesday: Season 2", thumbnail: "https://img.youtube.com/vi/ueCc-AYUMRs/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ueCc-AYUMRs", actors: "Jenna Ortega, Catherine Zeta-Jones", rating: "4.7", releaseDate: "2026-08-06", country: "AQSH", duration: 28, reward: "0", category: "Tele-shou" },
    { title: "Stranger Things: Season 4", thumbnail: "https://img.youtube.com/vi/a3thyAnShck/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=a3thyAnShck", actors: "Millie Bobby Brown, Finn Wolfhard", rating: "4.8", releaseDate: "2022-05-27", country: "AQSH", duration: 30, reward: "0", category: "Tele-shou" },
    { title: "House of the Dragon: Season 2", thumbnail: "https://img.youtube.com/vi/YN2H_sKcmGw/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=YN2H_sKcmGw", actors: "Matt Smith, Emma D'Arcy", rating: "4.7", releaseDate: "2024-06-16", country: "AQSH", duration: 25, reward: "0", category: "Tele-shou" },
    { title: "Money Heist: Berlin", thumbnail: "https://img.youtube.com/vi/ZONoMgeGAbI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ZONoMgeGAbI", actors: "Pedro Alonso, Michelle Jenner", rating: "4.3", releaseDate: "2023-12-29", country: "Ispaniya", duration: 20, reward: "0", category: "Tele-shou" },
    { title: "The Penguin", thumbnail: "https://img.youtube.com/vi/sfJG6IiA_s8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=sfJG6IiA_s8", actors: "Colin Farrell, Cristin Milioti", rating: "4.6", releaseDate: "2024-09-19", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Shōgun", thumbnail: "https://img.youtube.com/vi/yAN5uspO_hk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=yAN5uspO_hk", actors: "Hiroyuki Sanada, Cosmo Jarvis, Anna Sawai", rating: "4.9", releaseDate: "2024-02-27", country: "Yaponiya", duration: 26, reward: "0", category: "Tele-shou" },
    { title: "Fallout", thumbnail: "https://img.youtube.com/vi/0kQ8i2FpRDk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=0kQ8i2FpRDk", actors: "Ella Purnell, Walton Goggins, Aaron Moten", rating: "4.7", releaseDate: "2024-04-10", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "3 Body Problem", thumbnail: "https://img.youtube.com/vi/SdvzhCL7vIA/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=SdvzhCL7vIA", actors: "Jovan Adepo, John Bradley, Rosalind Chao", rating: "4.4", releaseDate: "2024-03-21", country: "AQSH", duration: 28, reward: "0", category: "Tele-shou" },
    { title: "The Bear: Season 3", thumbnail: "https://img.youtube.com/vi/f_bhYFCtavY/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=f_bhYFCtavY", actors: "Jeremy Allen White, Ayo Edebiri, Ebon Moss-Bachrach", rating: "4.6", releaseDate: "2024-06-27", country: "AQSH", duration: 20, reward: "0", category: "Tele-shou" },
    { title: "Arcane: Season 2", thumbnail: "https://img.youtube.com/vi/ysqiEC6bLUI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ysqiEC6bLUI", actors: "Hailee Steinfeld, Ella Purnell, Katie Leung", rating: "4.9", releaseDate: "2024-11-09", country: "AQSH", duration: 23, reward: "0", category: "Tele-shou" },
    { title: "Reacher: Season 3", thumbnail: "https://img.youtube.com/vi/mCFXvDeUoi0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=mCFXvDeUoi0", actors: "Alan Ritchson, Maria Sten", rating: "4.5", releaseDate: "2025-02-20", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Loki: Season 2", thumbnail: "https://img.youtube.com/vi/nW948Va-l10/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=nW948Va-l10", actors: "Tom Hiddleston, Owen Wilson, Sophia Di Martino", rating: "4.7", releaseDate: "2023-10-06", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "The Mandalorian", thumbnail: "https://img.youtube.com/vi/Znsa4Deavgg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=Znsa4Deavgg", actors: "Pedro Pascal, Katee Sackhoff", rating: "4.8", releaseDate: "2023-03-01", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Rings of Power", thumbnail: "https://img.youtube.com/vi/v7v1hIkYH24/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=v7v1hIkYH24", actors: "Morfydd Clark, Robert Aramayo", rating: "4.5", releaseDate: "2024-08-29", country: "AQSH", duration: 26, reward: "0", category: "Tele-shou" },
    { title: "Peaky Blinders: Season 6", thumbnail: "https://img.youtube.com/vi/oVzVdvGIC7U/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=oVzVdvGIC7U", actors: "Cillian Murphy, Tom Hardy, Helen McCrory", rating: "4.8", releaseDate: "2022-02-27", country: "Buyuk Britaniya", duration: 25, reward: "0", category: "Tele-shou" },
    { title: "Thor: Ragnarok", thumbnail: "https://img.youtube.com/vi/ue80QwXMRHg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ue80QwXMRHg", actors: "Chris Hemsworth, Tom Hiddleston, Cate Blanchett", rating: "4.7", releaseDate: "2017-11-03", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "Black Widow", thumbnail: "https://img.youtube.com/vi/Fp9pNPdNwjI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=Fp9pNPdNwjI", actors: "Scarlett Johansson, Florence Pugh, David Harbour", rating: "4.5", releaseDate: "2021-07-09", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Better Call Saul", thumbnail: "https://img.youtube.com/vi/HN4oydykJFc/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=HN4oydykJFc", actors: "Bob Odenkirk, Rhea Seehorn, Jonathan Banks", rating: "4.9", releaseDate: "2022-04-18", country: "AQSH", duration: 28, reward: "0", category: "Tele-shou" },
    { title: "Thunderbolts*", thumbnail: "https://img.youtube.com/vi/-sAOWhvheK8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=-sAOWhvheK8", actors: "Florence Pugh, Sebastian Stan", rating: "4.6", releaseDate: "2025-05-02", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Mission Impossible: Final Reckoning", thumbnail: "https://img.youtube.com/vi/fsQgc9pCyDU/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=fsQgc9pCyDU", actors: "Tom Cruise, Hayley Atwell", rating: "4.9", releaseDate: "2025-05-23", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Avatar 3: Fire and Ash", thumbnail: "https://img.youtube.com/vi/xxEt9fnILgQ/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=xxEt9fnILgQ", actors: "Sam Worthington, Zoe Saldana", rating: "4.8", releaseDate: "2025-12-19", country: "AQSH", duration: 28, reward: "0", category: "Treyler" },
    { title: "Dune: Part Two", thumbnail: "https://img.youtube.com/vi/8g18jFHCLXk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=8g18jFHCLXk", actors: "Timothée Chalamet, Zendaya, Austin Butler", rating: "4.8", releaseDate: "2024-03-01", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "Deadpool & Wolverine", thumbnail: "https://img.youtube.com/vi/73_1biulkYk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=73_1biulkYk", actors: "Ryan Reynolds, Hugh Jackman", rating: "4.7", releaseDate: "2024-07-26", country: "AQSH", duration: 23, reward: "0", category: "Treyler" },
    { title: "Gladiator II", thumbnail: "https://img.youtube.com/vi/4rgYUipGJNo/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo", actors: "Paul Mescal, Pedro Pascal, Denzel Washington", rating: "4.6", releaseDate: "2024-11-22", country: "AQSH", duration: 27, reward: "0", category: "Treyler" },
    { title: "Wicked", thumbnail: "https://img.youtube.com/vi/6COmYeLsz4c/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=6COmYeLsz4c", actors: "Ariana Grande, Cynthia Erivo", rating: "4.7", releaseDate: "2024-11-22", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Joker: Folie à Deux", thumbnail: "https://img.youtube.com/vi/_OKAwz2MsJs/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=_OKAwz2MsJs", actors: "Joaquin Phoenix, Lady Gaga", rating: "4.3", releaseDate: "2024-10-04", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Godzilla x Kong: The New Empire", thumbnail: "https://img.youtube.com/vi/lV1OOlGwExM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=lV1OOlGwExM", actors: "Rebecca Hall, Brian Tyree Henry", rating: "4.4", releaseDate: "2024-03-29", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "Venom: The Last Dance", thumbnail: "https://img.youtube.com/vi/__2bjWbetsA/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=__2bjWbetsA", actors: "Tom Hardy, Chiwetel Ejiofor", rating: "4.2", releaseDate: "2024-10-25", country: "AQSH", duration: 21, reward: "0", category: "Treyler" },
    { title: "Inside Out 2", thumbnail: "https://img.youtube.com/vi/LEjhY15eCx0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LEjhY15eCx0", actors: "Amy Poehler, Maya Hawke", rating: "4.8", releaseDate: "2024-06-14", country: "AQSH", duration: 20, reward: "0", category: "Treyler" },
    { title: "Doctor Strange: Multiverse of Madness", thumbnail: "https://img.youtube.com/vi/Rt_UqUm38BI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=Rt_UqUm38BI", actors: "Benedict Cumberbatch, Elizabeth Olsen", rating: "4.5", releaseDate: "2022-05-06", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "Oppenheimer", thumbnail: "https://img.youtube.com/vi/uYPbbksJxIg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg", actors: "Cillian Murphy, Emily Blunt, Robert Downey Jr.", rating: "4.9", releaseDate: "2023-07-21", country: "AQSH", duration: 30, reward: "0", category: "Treyler" },
    { title: "John Wick: Chapter 4", thumbnail: "https://img.youtube.com/vi/qEVUtrk8_B4/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=qEVUtrk8_B4", actors: "Keanu Reeves, Donnie Yen, Bill Skarsgård", rating: "4.8", releaseDate: "2023-03-24", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Top Gun: Maverick", thumbnail: "https://img.youtube.com/vi/giXco2jaZ_4/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=giXco2jaZ_4", actors: "Tom Cruise, Miles Teller, Jennifer Connelly", rating: "4.9", releaseDate: "2022-05-27", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Kung Fu Panda 4", thumbnail: "https://img.youtube.com/vi/_inKs4eeHiI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=_inKs4eeHiI", actors: "Jack Black, Awkwafina, Viola Davis", rating: "4.5", releaseDate: "2024-03-08", country: "AQSH", duration: 20, reward: "0", category: "Treyler" },
    { title: "Furiosa: A Mad Max Saga", thumbnail: "https://img.youtube.com/vi/XJMuhwVlca4/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=XJMuhwVlca4", actors: "Anya Taylor-Joy, Chris Hemsworth", rating: "4.6", releaseDate: "2024-05-24", country: "Avstraliya", duration: 28, reward: "0", category: "Treyler" },
    { title: "Inception", thumbnail: "https://img.youtube.com/vi/YoHD9XEInc0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0", actors: "Leonardo DiCaprio, Tom Hardy, Joseph Gordon-Levitt", rating: "4.9", releaseDate: "2010-07-16", country: "AQSH", duration: 28, reward: "0", category: "Treyler" },
    { title: "Interstellar", thumbnail: "https://img.youtube.com/vi/zSWdZVtXT7E/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E", actors: "Matthew McConaughey, Anne Hathaway, Jessica Chastain", rating: "4.9", releaseDate: "2014-11-07", country: "AQSH", duration: 30, reward: "0", category: "Treyler" },
    { title: "Moana 2", thumbnail: "https://img.youtube.com/vi/hDZ7y8RP5HE/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=hDZ7y8RP5HE", actors: "Auli'i Cravalho, Dwayne Johnson", rating: "4.6", releaseDate: "2024-11-27", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },

    { title: "Captain America: Brave New World", thumbnail: "https://img.youtube.com/vi/1pHDWnXmK7Y/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=1pHDWnXmK7Y", actors: "Anthony Mackie, Harrison Ford, Tim Blake Nelson", rating: "4.5", releaseDate: "2025-02-14", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Superman", thumbnail: "https://img.youtube.com/vi/y2dfTxk58mg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=y2dfTxk58mg", actors: "David Corenswet, Rachel Brosnahan", rating: "4.7", releaseDate: "2025-07-11", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "The Fantastic Four: First Steps", thumbnail: "https://img.youtube.com/vi/18QQWa5MEcs/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=18QQWa5MEcs", actors: "Pedro Pascal, Vanessa Kirby, Joseph Quinn", rating: "4.6", releaseDate: "2025-07-25", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "Jurassic World Rebirth", thumbnail: "https://img.youtube.com/vi/jan5CFWs9ic/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=jan5CFWs9ic", actors: "Scarlett Johansson, Jonathan Bailey, Mahershala Ali", rating: "4.5", releaseDate: "2025-07-02", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "28 Years Later", thumbnail: "https://img.youtube.com/vi/mcvLKldPM08/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=mcvLKldPM08", actors: "Cillian Murphy, Aaron Taylor-Johnson, Jodie Comer", rating: "4.7", releaseDate: "2025-06-20", country: "Buyuk Britaniya", duration: 26, reward: "0", category: "Treyler" },
    { title: "A Minecraft Movie", thumbnail: "https://img.youtube.com/vi/gbNzxvz2_H4/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=gbNzxvz2_H4", actors: "Jason Momoa, Jack Black, Jennifer Coolidge", rating: "4.3", releaseDate: "2025-04-04", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "Karate Kid: Legends", thumbnail: "https://img.youtube.com/vi/LhRXf-yEQqA/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LhRXf-yEQqA", actors: "Jackie Chan, Ralph Macchio, Ben Wang", rating: "4.4", releaseDate: "2025-05-30", country: "AQSH", duration: 23, reward: "0", category: "Treyler" },
    { title: "Snow White", thumbnail: "https://img.youtube.com/vi/iV46TJKL8cU/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=iV46TJKL8cU", actors: "Rachel Zegler, Gal Gadot", rating: "4.2", releaseDate: "2025-03-21", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "How to Train Your Dragon", thumbnail: "https://img.youtube.com/vi/22w7z_lT6YM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=22w7z_lT6YM", actors: "Mason Thames, Nico Parker, Gerard Butler", rating: "4.6", releaseDate: "2025-06-13", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Sinners", thumbnail: "https://img.youtube.com/vi/bKGxHflevuk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=bKGxHflevuk", actors: "Michael B. Jordan, Hailee Steinfeld", rating: "4.7", releaseDate: "2025-04-18", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "Elio", thumbnail: "https://img.youtube.com/vi/ETVi5_cnnaE/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ETVi5_cnnaE", actors: "Yonas Kibreab, Zoe Saldana, Jemaine Clement", rating: "4.5", releaseDate: "2025-06-13", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },

    { title: "The Batman", thumbnail: "https://img.youtube.com/vi/NLOp_6uPccQ/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=NLOp_6uPccQ", actors: "Robert Pattinson, Zoë Kravitz, Colin Farrell", rating: "4.7", releaseDate: "2022-03-04", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Spider-Man: Across the Spider-Verse", thumbnail: "https://img.youtube.com/vi/shW9i6k8cB0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=shW9i6k8cB0", actors: "Shameik Moore, Hailee Steinfeld, Oscar Isaac", rating: "4.9", releaseDate: "2023-06-02", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Guardians of the Galaxy Vol. 3", thumbnail: "https://img.youtube.com/vi/u3V5KDHRQvk/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=u3V5KDHRQvk", actors: "Chris Pratt, Zoe Saldana, Will Poulter", rating: "4.8", releaseDate: "2023-05-05", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "Barbie", thumbnail: "https://img.youtube.com/vi/pBk4NYhWNMM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=pBk4NYhWNMM", actors: "Margot Robbie, Ryan Gosling, Will Ferrell", rating: "4.5", releaseDate: "2023-07-21", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "The Dark Knight", thumbnail: "https://img.youtube.com/vi/EXeTwQWrcwY/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY", actors: "Christian Bale, Heath Ledger, Aaron Eckhart", rating: "4.9", releaseDate: "2008-07-18", country: "AQSH", duration: 28, reward: "0", category: "Treyler" },
    { title: "The Matrix", thumbnail: "https://img.youtube.com/vi/vKQi3bBA1y8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=vKQi3bBA1y8", actors: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss", rating: "4.9", releaseDate: "1999-03-31", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Avengers: Endgame", thumbnail: "https://img.youtube.com/vi/TcMBFSGVi1c/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=TcMBFSGVi1c", actors: "Robert Downey Jr., Chris Evans, Scarlett Johansson", rating: "4.9", releaseDate: "2019-04-26", country: "AQSH", duration: 30, reward: "0", category: "Treyler" },
    { title: "Parasite", thumbnail: "https://img.youtube.com/vi/5xH0HfJHsaY/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=5xH0HfJHsaY", actors: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong", rating: "4.9", releaseDate: "2019-05-30", country: "Janubiy Koreya", duration: 24, reward: "0", category: "Treyler" },
    { title: "Everything Everywhere All at Once", thumbnail: "https://img.youtube.com/vi/wxN1T1uxQ2g/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=wxN1T1uxQ2g", actors: "Michelle Yeoh, Stephanie Hsu, Ke Huy Quan", rating: "4.8", releaseDate: "2022-03-25", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "The Shawshank Redemption", thumbnail: "https://img.youtube.com/vi/NmzuHjWmXOc/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=NmzuHjWmXOc", actors: "Tim Robbins, Morgan Freeman", rating: "4.9", releaseDate: "1994-09-23", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Fight Club", thumbnail: "https://img.youtube.com/vi/qtRKdVHc-cE/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=qtRKdVHc-cE", actors: "Brad Pitt, Edward Norton, Helena Bonham Carter", rating: "4.8", releaseDate: "1999-10-15", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },
    { title: "Pulp Fiction", thumbnail: "https://img.youtube.com/vi/s7EdQ4FqbhY/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=s7EdQ4FqbhY", actors: "John Travolta, Uma Thurman, Samuel L. Jackson", rating: "4.9", releaseDate: "1994-10-14", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "The Godfather", thumbnail: "https://img.youtube.com/vi/UaVTIH8mujA/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=UaVTIH8mujA", actors: "Marlon Brando, Al Pacino, James Caan", rating: "4.9", releaseDate: "1972-03-24", country: "AQSH", duration: 28, reward: "0", category: "Treyler" },
    { title: "Titanic", thumbnail: "https://img.youtube.com/vi/kVrqfYjkTdQ/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=kVrqfYjkTdQ", actors: "Leonardo DiCaprio, Kate Winslet, Billy Zane", rating: "4.8", releaseDate: "1997-12-19", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "Forrest Gump", thumbnail: "https://img.youtube.com/vi/bLvqoHBptjg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=bLvqoHBptjg", actors: "Tom Hanks, Robin Wright, Gary Sinise", rating: "4.9", releaseDate: "1994-07-06", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Gladiator", thumbnail: "https://img.youtube.com/vi/owK1qxDselE/hqdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=owK1qxDselE", actors: "Russell Crowe, Joaquin Phoenix, Connie Nielsen", rating: "4.8", releaseDate: "2000-05-05", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "The Wolf of Wall Street", thumbnail: "https://img.youtube.com/vi/iszwuX1AK6A/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=iszwuX1AK6A", actors: "Leonardo DiCaprio, Jonah Hill, Margot Robbie", rating: "4.7", releaseDate: "2013-12-25", country: "AQSH", duration: 28, reward: "0", category: "Treyler" },
    { title: "Shutter Island", thumbnail: "https://img.youtube.com/vi/5iaYLCiq5RM/hqdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=5iaYLCiq5RM", actors: "Leonardo DiCaprio, Mark Ruffalo, Ben Kingsley", rating: "4.8", releaseDate: "2010-02-19", country: "AQSH", duration: 24, reward: "0", category: "Treyler" },
    { title: "Django Unchained", thumbnail: "https://img.youtube.com/vi/0fUCuvNlOCg/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=0fUCuvNlOCg", actors: "Jamie Foxx, Christoph Waltz, Leonardo DiCaprio", rating: "4.8", releaseDate: "2012-12-25", country: "AQSH", duration: 26, reward: "0", category: "Treyler" },
    { title: "The Revenant", thumbnail: "https://img.youtube.com/vi/LoebZZ8K5N0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LoebZZ8K5N0", actors: "Leonardo DiCaprio, Tom Hardy", rating: "4.7", releaseDate: "2015-12-25", country: "AQSH", duration: 25, reward: "0", category: "Treyler" },
    { title: "Mad Max: Fury Road", thumbnail: "https://img.youtube.com/vi/hEJnMQG9ev8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=hEJnMQG9ev8", actors: "Tom Hardy, Charlize Theron", rating: "4.8", releaseDate: "2015-05-15", country: "Avstraliya", duration: 24, reward: "0", category: "Treyler" },
    { title: "No Country for Old Men", thumbnail: "https://img.youtube.com/vi/38A__WT3-o0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=38A__WT3-o0", actors: "Javier Bardem, Josh Brolin, Tommy Lee Jones", rating: "4.8", releaseDate: "2007-11-09", country: "AQSH", duration: 22, reward: "0", category: "Treyler" },

    { title: "Daredevil: Born Again", thumbnail: "https://img.youtube.com/vi/7xALolZzhSM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=7xALolZzhSM", actors: "Charlie Cox, Vincent D'Onofrio", rating: "4.7", releaseDate: "2025-03-04", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "Andor: Season 2", thumbnail: "https://img.youtube.com/vi/duN-KQgOjYs/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=duN-KQgOjYs", actors: "Diego Luna, Stellan Skarsgård", rating: "4.8", releaseDate: "2025-04-22", country: "AQSH", duration: 26, reward: "0", category: "Tele-shou" },
    { title: "The White Lotus: Season 3", thumbnail: "https://img.youtube.com/vi/XwQRkOK5KC4/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=XwQRkOK5KC4", actors: "Walton Goggins, Patrick Schwarzenegger, Aimee Lou Wood", rating: "4.6", releaseDate: "2025-02-16", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Severance: Season 2", thumbnail: "https://img.youtube.com/vi/_UXKlYvLGJY/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=_UXKlYvLGJY", actors: "Adam Scott, Britt Lower, Zach Cherry", rating: "4.9", releaseDate: "2025-01-17", country: "AQSH", duration: 28, reward: "0", category: "Tele-shou" },
    { title: "Yellowjackets: Season 3", thumbnail: "https://img.youtube.com/vi/x8FUUxj6yOA/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=x8FUUxj6yOA", actors: "Melanie Lynskey, Tawny Cypress, Christina Ricci", rating: "4.5", releaseDate: "2025-02-14", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "You: Season 5", thumbnail: "https://img.youtube.com/vi/kQdEHQLHDAI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=kQdEHQLHDAI", actors: "Penn Badgley, Charlotte Ritchie", rating: "4.5", releaseDate: "2025-04-24", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Alien: Earth", thumbnail: "https://img.youtube.com/vi/ZbsiKjVAV28/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=ZbsiKjVAV28", actors: "Sydney Chandler, Timothy Olyphant", rating: "4.6", releaseDate: "2025-07-22", country: "AQSH", duration: 25, reward: "0", category: "Tele-shou" },
    { title: "The Diplomat: Season 3", thumbnail: "https://img.youtube.com/vi/l6UX4V71jzc/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=l6UX4V71jzc", actors: "Keri Russell, Rufus Sewell", rating: "4.4", releaseDate: "2025-03-01", country: "AQSH", duration: 22, reward: "0", category: "Tele-shou" },
    { title: "Cobra Kai: Season 6", thumbnail: "https://img.youtube.com/vi/k1g4Ohe_Hs8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=k1g4Ohe_Hs8", actors: "Ralph Macchio, William Zabka, Xolo Maridueña", rating: "4.6", releaseDate: "2025-02-13", country: "AQSH", duration: 24, reward: "0", category: "Tele-shou" },
    { title: "Black Mirror: Season 7", thumbnail: "https://img.youtube.com/vi/1iqra1ojEvM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=1iqra1ojEvM", actors: "Awkwafina, Peter Capaldi, Rashida Jones", rating: "4.7", releaseDate: "2025-04-10", country: "Buyuk Britaniya", duration: 26, reward: "0", category: "Tele-shou" },
  ];
  await db.delete(videos);
  for (const def of videoDefs) {
    await db.insert(videos).values(def);
  }
  console.log("Videos seeded (" + videoDefs.length + " total)");

  const existingPlans = await db.select().from(fundPlans);
  const planDefs = [
    { name: "F1", lockDays: 13, dailyRoi: "2.30", minDeposit: "10", maxDeposit: "54", returnPrincipal: true },
    { name: "F2", lockDays: 27, dailyRoi: "2.60", minDeposit: "55", maxDeposit: "249", returnPrincipal: true },
    { name: "F3", lockDays: 45, dailyRoi: "3.00", minDeposit: "250", maxDeposit: "999", returnPrincipal: true },
    { name: "F4", lockDays: null, dailyRoi: "4.00", minDeposit: "1000", maxDeposit: null, returnPrincipal: false },
  ];
  for (const def of planDefs) {
    const exists = existingPlans.find(p => p.name === def.name);
    if (!exists) {
      await db.insert(fundPlans).values(def);
    } else {
      await db.update(fundPlans)
        .set({ lockDays: def.lockDays, dailyRoi: def.dailyRoi, minDeposit: def.minDeposit, maxDeposit: def.maxDeposit, returnPrincipal: def.returnPrincipal })
        .where(eq(fundPlans.id, exists.id));
    }
  }
  console.log("Fund plans seeded (4 F-Series) - IDs preserved");
}
