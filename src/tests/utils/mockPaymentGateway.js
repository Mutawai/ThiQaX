/**
 * Mock Payment Gateway for testing payment flows
 * This utility simulates external payment service interactions
 */

class MockPaymentGateway {
  constructor() {
    this.transactions = [];
    this.escrowAccounts = {};
    this.nextTransactionId = 1;
  }

  /**
   * Create a payment transaction
   * @param {Object} params Payment parameters
   * @returns {Object} Transaction details
   */
  async createTransaction(params) {
    const { amount, currency, fromAccount, toAccount, type, description } = params;
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    if (!fromAccount || !toAccount) {
      throw new Error('Source and destination accounts are required');
    }

    const transactionId = `TX-${this.nextTransactionId++}`;
    const timestamp = new Date();
    
    const transaction = {
      id: transactionId,
      amount,
      currency: currency || 'USD',
      fromAccount,
      toAccount,
      type: type || 'PAYMENT',
      description,
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.transactions.push(transaction);
    return transaction;
  }

  /**
   * Process a payment transaction
   * @param {string} transactionId ID of the transaction to process
   * @returns {Object} Updated transaction
   */
  async processTransaction(transactionId) {
    const transaction = this.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    if (transaction.status !== 'PENDING') {
      throw new Error(`Cannot process transaction in ${transaction.status} status`);
    }
    
    // Simulate a small delay for realistic behavior
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 95% success rate for testing
    const isSuccessful = Math.random() < 0.95;
    
    if (isSuccessful) {
      transaction.status = 'COMPLETED';
    } else {
      transaction.status = 'FAILED';
      transaction.failReason = 'Payment processor error';
    }
    
    transaction.updatedAt = new Date();
    return transaction;
  }

  /**
   * Create an escrow account
   * @param {Object} params Escrow account parameters
   * @returns {Object} Escrow account details
   */
  async createEscrowAccount(params) {
    const { owner, name, currency } = params;
    
    if (!owner) {
      throw new Error('Owner is required');
    }
    
    const accountId = `ESCROW-${Date.now()}`;
    
    const escrowAccount = {
      id: accountId,
      owner,
      name: name || `Escrow Account for ${owner}`,
      currency: currency || 'USD',
      balance: 0,
      locked: false,
      transactions: [],
      createdAt: new Date()
    };
    
    this.escrowAccounts[accountId] = escrowAccount;
    return escrowAccount;
  }

  /**
   * Deposit funds into an escrow account
   * @param {Object} params Deposit parameters
   * @returns {Object} Updated escrow account
   */
  async depositToEscrow(params) {
    const { accountId, amount, reference, description } = params;
    
    if (!accountId || !this.escrowAccounts[accountId]) {
      throw new Error('Invalid escrow account');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    const escrowAccount = this.escrowAccounts[accountId];
    
    if (escrowAccount.locked) {
      throw new Error('Escrow account is locked');
    }
    
    const transactionId = `ESCROW-TX-${Date.now()}`;
    const timestamp = new Date();
    
    const transaction = {
      id: transactionId,
      type: 'DEPOSIT',
      amount,
      reference,
      description,
      createdAt: timestamp
    };
    
    escrowAccount.balance += amount;
    escrowAccount.transactions.push(transaction);
    
    return {
      account: escrowAccount,
      transaction
    };
  }

  /**
   * Release funds from an escrow account
   * @param {Object} params Release parameters
   * @returns {Object} Updated escrow account
   */
  async releaseFromEscrow(params) {
    const { accountId, amount, toAccount, reference, description } = params;
    
    if (!accountId || !this.escrowAccounts[accountId]) {
      throw new Error('Invalid escrow account');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }
    
    if (!toAccount) {
      throw new Error('Destination account is required');
    }
    
    const escrowAccount = this.escrowAccounts[accountId];
    
    if (escrowAccount.locked) {
      throw new Error('Escrow account is locked');
    }
    
    if (escrowAccount.balance < amount) {
      throw new Error('Insufficient funds in escrow');
    }
    
    const transactionId = `ESCROW-TX-${Date.now()}`;
    const timestamp = new Date();
    
    const transaction = {
      id: transactionId,
      type: 'RELEASE',
      amount,
      toAccount,
      reference,
      description,
      createdAt: timestamp
    };
    
    escrowAccount.balance -= amount;
    escrowAccount.transactions.push(transaction);
    
    return {
      account: escrowAccount,
      transaction
    };
  }

  /**
   * Get transaction details
   * @param {string} transactionId ID of the transaction
   * @returns {Object} Transaction details
   */
  async getTransaction(transactionId) {
    const transaction = this.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    return transaction;
  }

  /**
   * Get escrow account details
   * @param {string} accountId ID of the escrow account
   * @returns {Object} Escrow account details
   */
  async getEscrowAccount(accountId) {
    const account = this.escrowAccounts[accountId];
    
    if (!account) {
      throw new Error('Escrow account not found');
    }
    
    return account;
  }

  /**
   * Reset the mock payment gateway state
   * Useful between tests
   */
  reset() {
    this.transactions = [];
    this.escrowAccounts = {};
    this.nextTransactionId = 1;
  }
}

module.exports = MockPaymentGateway;
