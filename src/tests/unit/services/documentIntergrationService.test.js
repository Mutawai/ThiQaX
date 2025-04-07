// src/tests/unit/services/documentIntegrationService.test.js

const mongoose = require('mongoose');
const { expect } = require('chai');
const sinon = require('sinon');

// Import the services to test
const documentIntegrationService = require('../../../services/documentIntegrationService');

// Import models 
const Document = require('../../../models/Document');
const Application = require('../../../models/Application');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Job = require('../../../models/Job');
const Notification = require('../../../models/Notification');

describe('Document Integration Service', () => {
  // Setup for tests
  before(async () => {
    // Connect to test database if needed
  });

  // Cleanup after tests
  after(async () => {
    // Disconnect from test database
    sinon.restore();
  });

  // Reset stubs between tests
  afterEach(() => {
    sinon.reset();
  });

  describe('linkDocumentsToApplication', () => {
    it('should successfully link documents to an application', async () => {
      // Arrange: Create test stubs
      const applicationId = new mongoose.Types.ObjectId();
      const documentIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];
      const userId = new mongoose.Types.ObjectId();
      const jobId = new mongoose.Types.ObjectId();
      const jobPosterId = new mongoose.Types.ObjectId();
      
      // Create stubs for database operations
      const findApplicationStub = sinon.stub(Application, 'findById').resolves({
        _id: applicationId,
        user: userId,
        job: jobId,
        documents: [],
        save: sinon.stub().resolves(true)
      });
      
      const findDocumentsStub = sinon.stub(Document, 'find').resolves([
        { _id: documentIds[0], application: null, save: sinon.stub().resolves(true) },
        { _id: documentIds[1], application: null, save: sinon.stub().resolves(true) }
      ]);
      
      const findJobStub = sinon.stub(Job, 'findById').resolves({
        _id: jobId,
        user: jobPosterId,
        populate: sinon.stub().returnsThis()
      });
      
      const findUserStub = sinon.stub(User, 'findById').resolves({
        _id: userId,
        firstName: 'John',
        lastName: 'Doe'
      });
      
      const createNotificationStub = sinon.stub(notificationService, 'sendNotification').resolves({});
      
      // Act
      const result = await documentIntegrationService.linkDocumentsToApplication(
        applicationId, 
        documentIds
      );
      
      // Assert
      expect(findApplicationStub.calledOnce).to.be.true;
      expect(findDocumentsStub.calledOnce).to.be.true;
      expect(findJobStub.calledOnce).to.be.true;
      expect(findUserStub.calledOnce).to.be.true;
      expect(createNotificationStub.calledOnce).to.be.true;
      expect(result).to.exist;
    });
    
    it('should throw 404 when application does not exist', async () => {
      // Arrange
      const applicationId = new mongoose.Types.ObjectId();
      const documentIds = [new mongoose.Types.ObjectId()];
      
      sinon.stub(Application, 'findById').resolves(null);
      
      // Act & Assert
      try {
        await documentIntegrationService.linkDocumentsToApplication(applicationId, documentIds);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.include('Application not found');
      }
    });
    
    it('should throw 404 when one or more documents do not exist', async () => {
      // Arrange
      const applicationId = new mongoose.Types.ObjectId();
      const documentIds = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];
      
      sinon.stub(Application, 'findById').resolves({
        _id: applicationId,
        documents: [],
        save: sinon.stub().resolves(true)
      });
      
      // Only returns one document when two were requested
      sinon.stub(Document, 'find').resolves([
        { _id: documentIds[0], save: sinon.stub().resolves(true) }
      ]);
      
      // Act & Assert
      try {
        await documentIntegrationService.linkDocumentsToApplication(applicationId, documentIds);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.include('One or more documents not found');
      }
    });
  });

  describe('updateDocumentVerificationStatus', () => {
    it('should update document status to VERIFIED', async () => {
      // Arrange
      const documentId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const status = 'VERIFIED';
      
      const documentStub = {
        _id: documentId,
        status: 'PENDING',
        user: new mongoose.Types.ObjectId(),
        verifiedBy: null,
        verifiedAt: null,
        rejectionReason: null,
        application: null,
        save: sinon.stub().resolves(true)
      };
      
      sinon.stub(Document, 'findById').resolves(documentStub);
      sinon.stub(notificationService, 'sendNotification').resolves({});
      
      // Need to stub these private methods since they're called internally
      sinon.stub(documentIntegrationService, '_updateApplicationDocumentStatus').resolves();
      sinon.stub(documentIntegrationService, '_updateUserKycStatus').resolves();
      
      // Act
      const result = await documentIntegrationService.updateDocumentVerificationStatus(
        documentId,
        status,
        null,
        userId
      );
      
      // Assert
      expect(result).to.exist;
      expect(result.status).to.equal('VERIFIED');
      expect(result.verifiedBy).to.deep.equal(userId);
      expect(result.verifiedAt).to.exist;
      expect(result.rejectionReason).to.be.null;
    });
    
    it('should update document status to REJECTED with reason', async () => {
      // Arrange
      const documentId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const status = 'REJECTED';
      const rejectionReason = 'Document is illegible';
      
      const documentStub = {
        _id: documentId,
        status: 'PENDING',
        user: new mongoose.Types.ObjectId(),
        verifiedBy: null,
        verifiedAt: null,
        rejectionReason: null,
        application: null,
        save: sinon.stub().resolves(true)
      };
      
      sinon.stub(Document, 'findById').resolves(documentStub);
      sinon.stub(notificationService, 'sendNotification').resolves({});
      
      // Need to stub these private methods since they're called internally
      sinon.stub(documentIntegrationService, '_updateApplicationDocumentStatus').resolves();
      sinon.stub(documentIntegrationService, '_updateUserKycStatus').resolves();
      
      // Act
      const result = await documentIntegrationService.updateDocumentVerificationStatus(
        documentId,
        status,
        rejectionReason,
        userId
      );
      
      // Assert
      expect(result).to.exist;
      expect(result.status).to.equal('REJECTED');
      expect(result.verifiedBy).to.deep.equal(userId);
      expect(result.verifiedAt).to.exist;
      expect(result.rejectionReason).to.equal(rejectionReason);
    });
    
    it('should throw 400 when status is REJECTED but no reason is provided', async () => {
      // Arrange
      const documentId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const status = 'REJECTED';
      
      const documentStub = {
        _id: documentId,
        status: 'PENDING',
        user: new mongoose.Types.ObjectId(),
        application: null,
      };
      
      sinon.stub(Document, 'findById').resolves(documentStub);
      
      // Act & Assert
      try {
        await documentIntegrationService.updateDocumentVerificationStatus(
          documentId,
          status,
          null,
          userId
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).to.equal(400);
        expect(error.message).to.include('Rejection reason is required');
      }
    });
    
    it('should throw 404 when document does not exist', async () => {
      // Arrange
      const documentId = new mongoose.Types.ObjectId();
      const userId = new mongoose.Types.ObjectId();
      const status = 'VERIFIED';
      
      sinon.stub(Document, 'findById').resolves(null);
      
      // Act & Assert
      try {
        await documentIntegrationService.updateDocumentVerificationStatus(
          documentId,
          status,
          null,
          userId
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.statusCode).to.equal(404);
        expect(error.message).to.include('Document not found');
      }
    });
  });

  describe('checkDocumentExpiration', () => {
    it('should send notifications for documents expiring soon', async () => {
      // Arrange
      const today = new Date();
      const almostExpired = new Date();
      almostExpired.setDate(today.getDate() + 15); // 15 days from now
      
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      
      const expiringDocuments = [
        {
          _id: new mongoose.Types.ObjectId(),
          user: { _id: user1, firstName: 'John', lastName: 'Doe' },
          documentType: 'PASSPORT',
          expiryDate: almostExpired,
          expiryNotified: false,
          save: sinon.stub().resolves(true)
        },
        {
          _id: new mongoose.Types.ObjectId(),
          user: { _id: user2, firstName: 'Jane', lastName: 'Smith' },
          documentType: 'WORK_PERMIT',
          expiryDate: almostExpired,
          expiryNotified: false,
          save: sinon.stub().resolves(true)
        }
      ];
      
      sinon.stub(Document, 'find').resolves(expiringDocuments);
      const notificationStub = sinon.stub(notificationService, 'sendNotification').resolves({});
      
      // Act
      const result = await documentIntegrationService.checkDocumentExpiration();
      
      // Assert
      expect(notificationStub.calledTwice).to.be.true;
      expect(result.processedCount).to.equal(2);
      expect(result.notifiedCount).to.equal(2);
      expect(expiringDocuments[0].expiryNotified).to.be.true;
      expect(expiringDocuments[1].expiryNotified).to.be.true;
    });
    
    it('should not process documents that are already notified', async () => {
      // Arrange
      sinon.stub(Document, 'find').resolves([]);
      const notificationStub = sinon.stub(notificationService, 'sendNotification').resolves({});
      
      // Act
      const result = await documentIntegrationService.checkDocumentExpiration();
      
      // Assert
      expect(notificationStub.called).to.be.false;
      expect(result.processedCount).to.equal(0);
      expect(result.notifiedCount).to.equal(0);
    });
  });
});
