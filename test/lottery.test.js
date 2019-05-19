const BigNumber = require("bignumber.js");
require("chai")
  .use(require("chai-bignumber")(BigNumber))
  .use(require("chai-as-promised"))
  .should();

const Lottery = artifacts.require("Lottery");

contract("Lottery", ([creator, player1, player2, player3, player4]) => {
  beforeEach(async () => {
    this.lottery = await Lottery.new();
    await this.lottery.enter({
      from: player2,
      value: web3.utils.toWei("1")
    }).should.be.fulfilled;

    await this.lottery.enter({
      from: player3,
      value: web3.utils.toWei("1")
    }).should.be.fulfilled;
  });

  describe("Lottery::init", () => {
    it("sets correct manager", async () => {
      let manager = await this.lottery.manager().should.be.fulfilled;
      manager.should.be.equal(creator, "Not correct manager address");
    });

    it("sets correct fee", async () => {
      let fee = await this.lottery.fee().should.be.fulfilled;
      feeStr = fee.toString();
      let result = new BigNumber(web3.utils.toWei("1"));
      feeStr.should.be.equal(result.toString(), "Not correct manager fee");
    });

    it("sets correct backup time", async () => {
      let backup = await this.lottery.backUpTime().should.be.fulfilled;
      backup.toString().should.be.equal("3600", "Not correct backup time");
    });
  });

  describe("Lottery::enter", () => {
    it("player should enter lottery paying 1 ether", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;
    });

    it("player should not enter lottery if paying different from 1 ether", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("2")
      }).should.not.be.fulfilled;
    });
  });

  describe("Lottery::pickWinner", () => {
    it("manager cannot call pickWinner if not enough players in lottery", async () => {
      await this.lottery.pickWinner().should.not.be.fulfilled;
    });

    it("random address cannot call pickWinner before backup time", async () => {
      await this.lottery.pickWinner({ from: player1 }).should.not.be.fulfilled;
    });

    it("manager can call pickWinner after 4 players voted", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;
      await this.lottery.enter({
        from: player4,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;

      await this.lottery.pickWinner().should.be.fulfilled;
    });
  });

  describe("Lottery::winner", () => {
    it("should return correct number of players", async () => {
      let players = await this.lottery.totalPlayers().should.be.fulfilled;

      players.toString().should.be.equal("2", "incorrect number of players");
    });

    it("should return a valid winner address", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;
      await this.lottery.enter({
        from: player4,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;

      await this.lottery.pickWinner().should.be.fulfilled;

      let winner = await this.lottery.winner();
      //not 0x0 address
      expect(winner).to.be.ok;
    });

    it("winner address can claim funds from pot", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;
      await this.lottery.enter({
        from: player4,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;

      await this.lottery.pickWinner().should.be.fulfilled;

      let winner = await this.lottery.winner();

      await this.lottery.claimWinnings({ from: winner }).should.be.fulfilled;
    });
  });

  describe("Lottery::pot", () => {
    it("pot should be 2 ethers after 2 players enter", async () => {
      let pot = await this.lottery.pot();
      let result = new BigNumber(web3.utils.toWei("2"));
      pot
        .toString()
        .should.be.equal(result.toString(), "Pot is not equal to 2 ether");
    });

    it("pot should be 0 when winnings are claimed", async () => {
      await this.lottery.enter({
        from: player3,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;
      await this.lottery.enter({
        from: player4,
        value: web3.utils.toWei("1")
      }).should.be.fulfilled;

      await this.lottery.pickWinner().should.be.fulfilled;
      let winner = await this.lottery.winner();
      await this.lottery.claimWinnings({ from: winner }).should.be.fulfilled;

      let pot = await this.lottery.pot();

      pot.toString().should.be.equal("0", "Pot is not equal to 2 ether");
    });
  });
});
