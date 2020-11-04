import bs58 from 'bs58';
import DaoAbi from '../contracts/mcdao.json';
import DaoAbiV2 from '../contracts/molochv2.json';
import DaoAbiV2x from '../contracts/molochv2x.json';

export class McDaoService {
  web3;
  daoContract;
  accountAddr;
  bcProcessor;
  contractAddr;
  version;

  constructor(web3, daoAddress, accountAddr, version) {
    this.web3 = web3;
    const abi = (version) => {
      if (version === 2) {
        return DaoAbiV2;
      }
      if (version === '2x') {
        return DaoAbiV2x;
      }
      return DaoAbi;
    };
    this.daoContract = new web3.eth.Contract(abi(version), daoAddress);
    this.accountAddr = accountAddr;
    this.contractAddr = daoAddress;
    this.version = version;
  }

  async getAllEvents() {
    const events = await this.daoContract.getPastEvents('allEvents', {
      fromBlock: 0,
      toBlock: 'latest',
    });
    return events;
  }

  async getCurrentPeriod() {
    const currentPeriod = await this.daoContract.methods
      .getCurrentPeriod()
      .call();
    return currentPeriod;
  }

  async getTotalShares(atBlock = 'latest') {
    const totalShares = await this.daoContract.methods
      .totalShares()
      .call({}, atBlock);
    return totalShares;
  }

  async getGracePeriodLength() {
    const gracePeriod = await this.daoContract.methods
      .gracePeriodLength()
      .call();
    return gracePeriod;
  }

  async getVotingPeriodLength() {
    const votingPeriod = await this.daoContract.methods
      .votingPeriodLength()
      .call();
    return votingPeriod;
  }

  async getPeriodDuration() {
    const periodDuration = await this.daoContract.methods
      .periodDuration()
      .call();
    return periodDuration;
  }

  async getProcessingReward() {
    const processingReward = await this.daoContract.methods
      .processingReward()
      .call();
    return processingReward;
  }

  async getProposalDeposit() {
    const proposalDeposit = await this.daoContract.methods
      .proposalDeposit()
      .call();
    return proposalDeposit;
  }

  async getGuildBankAddr() {
    const guildBank = await this.daoContract.methods.guildBank().call();
    return guildBank;
  }

  async approvedToken() {
    const tokenAddress = await this.daoContract.methods
      .approvedTokens(0)
      .call();
    return tokenAddress;
  }

  async members(account) {
    const members = await this.daoContract.methods.members(account).call();
    return members;
  }

  async memberAddressByDelegateKey(account) {
    const addressByDelegateKey = await this.daoContract.methods
      .memberAddressByDelegateKey(account)
      .call();
    return addressByDelegateKey.toLowerCase();
  }

  async canRagequit(highestIndexYesVote) {
    const canRage = await this.daoContract.methods
      .canRagequit(highestIndexYesVote)
      .call();
    return canRage;
  }

  async guildBank() {
    const guildBank = await this.daoContract.methods.guildBank().call();
    return guildBank;
  }

  async proposalQueue(id) {
    const info = await this.daoContract.methods.proposalQueue(id).call();
    return info;
  }

  async getApprovedTokens() {
    const tokenAddresses = await this.daoContract.methods
      .approvedTokens()
      .call();
    return tokenAddresses;
  }

  async getDepositToken() {
    const token = await this.daoContract.methods.depositToken().call();
    return token;
  }

  async getMemberProposalVote(address, index) {
    const proposalVote = await this.daoContract.methods
      .getMemberProposalVote(address, index)
      .call();
    return proposalVote;
  }

  async getProposalFlags(id) {
    const flags = await this.daoContract.methods.getProposalFlags(id).call();
    return flags;
  }

  async getUserTokenBalance(userAddress, tokenAddress) {
    const balance = await this.daoContract.methods
      .getUserTokenBalance(userAddress, tokenAddress)
      .call();
    return balance;
  }

  async hasVotingPeriodExpired(period) {
    const expired = await this.daoContract.methods
      .hasVotingPeriodExpired(period)
      .call();
    return expired;
  }

  async proposals(id) {
    const info = await this.daoContract.methods.proposals(+id).call();
    return info;
  }

  async proposedToKick(address) {
    const kick = await this.daoContract.methods.proposedToKick(address).call();
    return kick;
  }

  async proposedToWhitelist(address) {
    const whitelist = await this.daoContract.methods
      .proposedToWhitelist(address)
      .call();
    return whitelist;
  }

  async getTokenWhitelist(address) {
    const whitelist = await this.daoContract.methods
      .tokenWhitelist(address)
      .call();
    return whitelist;
  }

  async getTotalLoot() {
    const loot = await this.daoContract.methods.totalLoot().call();
    return loot;
  }

  async getUserTokenBalances(userAddress) {
    // TODO: does this only work on the guild address?
  }
}

export class ReadonlyMcDaoService extends McDaoService {
  async deployAccount() {
    throw new Error(`This account type cannot call deployAccount`);
  }
}

export class Web3McDaoService extends McDaoService {
  bcProcessor;

  constructor(web3, daoAddress, accountAddr, bcProcessor, version) {
    super(web3, daoAddress, accountAddr, version);
    this.bcProcessor = bcProcessor;
  }

  async submitVote(proposalIndex, uintVote) {
    const txReceipt = await this.daoContract.methods
      .submitVote(proposalIndex, uintVote)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Submit ${
        uintVote === 1 ? 'yes' : 'no'
      } vote on proposal ${proposalIndex}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async rageQuit(amount) {
    const txReceipt = await this.daoContract.methods
      .ragequit(amount)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Rage quit amount: ${amount}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async processProposal(id) {
    const txReceipt = await this.daoContract.methods
      .processProposal(id)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Process proposal. id: ${id}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async updateDelegateKey(newDelegateKey) {
    const txReceipt = await this.daoContract.methods
      .updateDelegateKey(newDelegateKey)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Update delegate key. newDelegateKey: ${newDelegateKey}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async submitProposal(applicant, tokenTribute, sharesRequested, details) {
    console.log(details);

    const b32details = this.web3.utils.fromAscii(details);
    const txReceipt = await this.daoContract.methods
      .submitProposal(applicant, tokenTribute, sharesRequested, b32details)
      .send({ from: this.accountAddr });

    // const parseDetails = JSON.parse(details);

    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Submit proposal (testTitle)`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async deployAccount() {
    throw new Error(`This account type cannot call deployAccount`);
  }
}

export class Web3McDaoServiceV2 extends Web3McDaoService {
  bcProcessor;

  // constructor(web3, daoAddress, accountAddr, bcProcessor) {
  //   super(web3, daoAddress, accountAddr, bcProcessor);
  //   this.bcProcessor = bcProcessor;
  // }

  async rageQuit(amountShares = 0, amountLoot = 0) {
    const txReceipt = await this.daoContract.methods
      .ragequit(amountShares, amountLoot)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Rage quit burn shares: ${amountShares} loot: ${amountLoot}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async cancelProposal(id) {
    const txReceipt = await this.daoContract.methods
      .cancelProposal(id)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Cancel proposal. id: ${id}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async processGuildKickProposal(id) {
    const txReceipt = await this.daoContract.methods
      .processGuildKickProposal(id)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Process Guild Kick Proposal. id: ${id}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async processWhitelistProposal(id) {
    const txReceipt = await this.daoContract.methods
      .processWhitelistProposal(id)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Process Whitelist Proposal. id: ${id}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async ragekick(address) {
    const txReceipt = await this.daoContract.methods
      .ragekick(address)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Rage Kick. address: ${address}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async sponsorProposal(id) {
    const txReceipt = await this.daoContract.methods
      .sponsorProposal(id)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Sponsor Proposal. id: ${id}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async submitProposal(
    sharesRequested,
    lootRequested,
    tributeOffered,
    tributeToken,
    paymentRequested,
    PaymentToken,
    details,
    applicant = this.accountAddr,
  ) {
    const txReceipt = await this.daoContract.methods
      .submitProposal(
        applicant,
        this.web3.utils.toWei(sharesRequested.toString()),
        this.web3.utils.toWei(lootRequested.toString()),
        tributeOffered,
        tributeToken,
        paymentRequested,
        PaymentToken,
        '0x' +
          bs58
            .decode(details)
            .slice(2)
            .toString('hex'),
      )
      .send({ from: this.accountAddr });

    // const parseDetails = JSON.parse(details);

    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Submit proposal (testTitle)`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async submitGuildKickProposal(memberToKick, details) {
    const txReceipt = await this.daoContract.methods
      .submitGuildKickProposal(memberToKick, details)
      .send({ from: this.accountAddr });

    const parseDetails = JSON.parse(details);

    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Submit guild kick proposal (${parseDetails.title})`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async submitWhiteListProposal(address, details) {
    console.log(address, details);
    let txReceipt = '';

    try {
      txReceipt = await this.daoContract.methods
        .submitWhitelistProposal(address, details)
        .send({ from: this.accountAddr });
    } catch (err) {
      console.log(err);
    }

    const parseDetails = JSON.parse(details);

    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Submit whitelist proposal (${parseDetails.title})`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async withdrawBalance(token, amount) {
    const txReceipt = await this.daoContract.methods
      .withdrawBalance(token, amount)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Withdraw Token. address: ${token}, amount ${amount}`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async withdrawBalances(tokens, amounts, max) {
    const txReceipt = await this.daoContract.methods
      .withdrawBalances(tokens, amounts, max)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Withdraw Token. tokens..., amounts...`,
      true,
    );
    return txReceipt.transactionHash;
  }

  async collectTokens(token) {
    console.log('token in service', token);
    console.log('daoContract.methods', this.daoContract.methods);
    const txReceipt = await this.daoContract.methods
      .collectTokens(token)
      .send({ from: this.accountAddr });
    this.bcProcessor.setTx(
      txReceipt.transactionHash,
      this.accountAddr,
      `Collect Token. token...`,
      true,
    );
    return txReceipt.transactionHash;
  }
}
