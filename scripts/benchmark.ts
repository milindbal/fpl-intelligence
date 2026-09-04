import fs from 'fs';
import path from 'path';

// read data
const players = JSON.parse(fs.readFileSync(path.resolve('./public/data/players.json'), 'utf-8'));
const fixtures = JSON.parse(fs.readFileSync(path.resolve('./public/data/fixtures.json'), 'utf-8'));
const gameweeks = JSON.parse(fs.readFileSync(path.resolve('./public/data/gameweeks.json'), 'utf-8'));
const teams = JSON.parse(fs.readFileSync(path.resolve('./public/data/teams.json'), 'utf-8'));

const nextGw = gameweeks.find((gw: any) => !gw.finished && !gw.is_current) || gameweeks[gameweeks.length - 1];

function runBaseline() {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        const options = players
            .map((player: any) => {
                const f = fixtures.find((fix: any) => fix.event === nextGw.id && (fix.team_h === player.teamId || fix.team_a === player.teamId));
                if (!f) return null;

                const isHome = f.team_h === player.teamId;
                const opponent = teams.find((t: any) => t.id === (isHome ? f.team_a : f.team_h));

                if (!opponent) return null;
                return { player, opponent, isHome };
            });
    }
    const end = performance.now();
    console.log(`Baseline: ${end - start} ms (100 iterations)`);
}

function runOptimized() {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        const fixtureByTeamId = new Map();
        for (const fix of fixtures) {
            if (fix.event === nextGw.id) {
                fixtureByTeamId.set(fix.team_h, fix);
                fixtureByTeamId.set(fix.team_a, fix);
            }
        }
        const teamById = new Map();
        for (const team of teams) {
            teamById.set(team.id, team);
        }

        const options = players
            .map((player: any) => {
                const f = fixtureByTeamId.get(player.teamId);
                if (!f) return null;

                const isHome = f.team_h === player.teamId;
                const opponentId = isHome ? f.team_a : f.team_h;
                const opponent = teamById.get(opponentId);

                if (!opponent) return null;
                return { player, opponent, isHome };
            });
    }
    const end = performance.now();
    console.log(`Optimized: ${end - start} ms (100 iterations)`);
}

runBaseline();
runOptimized();
