import assert from "node:assert/strict";
import test from "node:test";
import {
  INVITES_PER_REWARD,
  MAX_REWARDS,
  REWARD_DAYS,
  rewardsEarned,
} from "../src/lib/referral/rewards.ts";

test("a bonus arrives every third qualified invite", () => {
  assert.equal(rewardsEarned(0), 0);
  assert.equal(rewardsEarned(1), 0);
  assert.equal(rewardsEarned(2), 0);
  assert.equal(rewardsEarned(3), 1);
  assert.equal(rewardsEarned(5), 1);
  assert.equal(rewardsEarned(6), 2);
});

test("the ceiling holds however many invites arrive", () => {
  const atCeiling = MAX_REWARDS * INVITES_PER_REWARD;

  assert.equal(rewardsEarned(atCeiling), MAX_REWARDS);
  assert.equal(rewardsEarned(atCeiling + 3), MAX_REWARDS);
  assert.equal(rewardsEarned(10_000), MAX_REWARDS);
});

test("nonsense earns nothing rather than something strange", () => {
  assert.equal(rewardsEarned(-3), 0);
  assert.equal(rewardsEarned(Number.NaN), 0);
  assert.equal(rewardsEarned(Number.POSITIVE_INFINITY), 0);
});

test("the ceiling is worth reaching but bounded", () => {
  // Four bonuses of a week each: enough that inviting people is worth doing,
  // little enough that farming it is not.
  assert.equal(MAX_REWARDS * REWARD_DAYS, 28);
  assert.ok(MAX_REWARDS >= 2);
  assert.ok(MAX_REWARDS * REWARD_DAYS < 90);
});
