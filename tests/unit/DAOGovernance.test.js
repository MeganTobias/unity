const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DAOGovernance", function () {
    let daoGovernance;
    let assetToken;
    let owner;
    let addr1;
    let addr2;
    let addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        // Deploy AssetToken
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deploy();
        
        // Deploy DAOGovernance
        const DAOGovernance = await ethers.getContractFactory("DAOGovernance");
        daoGovernance = await DAOGovernance.deploy(assetToken.address);
        await daoGovernance.deployed();
        
        // Mint tokens to users
        await assetToken.mint(addr1.address, ethers.utils.parseEther("2000000")); // 2M tokens
        await assetToken.mint(addr2.address, ethers.utils.parseEther("1000000")); // 1M tokens
        await assetToken.mint(addr3.address, ethers.utils.parseEther("500000"));  // 500K tokens
    });

    describe("Deployment", function () {
        it("Should set the correct asset token", async function () {
            expect(await daoGovernance.assetToken()).to.equal(assetToken.address);
        });

        it("Should set the correct proposal threshold", async function () {
            expect(await daoGovernance.proposalThreshold()).to.equal(ethers.utils.parseEther("1000000")); // 1M tokens
        });

        it("Should set the correct quorum threshold", async function () {
            expect(await daoGovernance.quorumThreshold()).to.equal(ethers.utils.parseEther("10000000")); // 10M tokens
        });
    });

    describe("Proposal Creation", function () {
        it("Should allow users with sufficient voting power to create proposals", async function () {
            const title = "Test Proposal";
            const description = "A test proposal for governance";
            const calldata = "0x";
            
            const tx = await daoGovernance.connect(addr1).propose(title, description, calldata);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProposalCreated');
            
            expect(event.args.proposalId).to.equal(1);
            expect(event.args.proposer).to.equal(addr1.address);
            expect(event.args.title).to.equal(title);
        });

        it("Should not allow users with insufficient voting power to create proposals", async function () {
            const title = "Test Proposal";
            const description = "A test proposal for governance";
            const calldata = "0x";
            
            await expect(
                daoGovernance.connect(addr3).propose(title, description, calldata)
            ).to.be.revertedWith("DAOGovernance: insufficient voting power");
        });

        it("Should not allow empty proposal titles", async function () {
            const title = "";
            const description = "A test proposal for governance";
            const calldata = "0x";
            
            await expect(
                daoGovernance.connect(addr1).propose(title, description, calldata)
            ).to.be.revertedWith("DAOGovernance: name cannot be empty");
        });
    });

    describe("Voting", function () {
        let proposalId;

        beforeEach(async function () {
            // Create a proposal
            const tx = await daoGovernance.connect(addr1).propose(
                "Test Proposal",
                "A test proposal for governance",
                "0x"
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProposalCreated');
            proposalId = event.args.proposalId;
        });

        it("Should allow users to vote on proposals", async function () {
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            const tx = await daoGovernance.connect(addr2).vote(proposalId, true);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'VoteCast');
            
            expect(event.args.voter).to.equal(addr2.address);
            expect(event.args.proposalId).to.equal(proposalId);
            expect(event.args.support).to.be.true;
        });

        it("Should not allow voting before voting period starts", async function () {
            await expect(
                daoGovernance.connect(addr2).vote(proposalId, true)
            ).to.be.revertedWith("DAOGovernance: voting not started");
        });

        it("Should not allow voting after voting period ends", async function () {
            // Fast forward past voting period
            await ethers.provider.send("evm_increaseTime", [5 * 24 * 60 * 60]); // 5 days
            await ethers.provider.send("evm_mine");
            
            await expect(
                daoGovernance.connect(addr2).vote(proposalId, true)
            ).to.be.revertedWith("DAOGovernance: voting ended");
        });

        it("Should not allow users to vote twice", async function () {
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // First vote
            await daoGovernance.connect(addr2).vote(proposalId, true);
            
            // Second vote should fail
            await expect(
                daoGovernance.connect(addr2).vote(proposalId, false)
            ).to.be.revertedWith("DAOGovernance: already voted");
        });

        it("Should not allow users with no voting power to vote", async function () {
            // Create a new user with no tokens
            const [newUser] = await ethers.getSigners();
            
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            await expect(
                daoGovernance.connect(newUser).vote(proposalId, true)
            ).to.be.revertedWith("DAOGovernance: no voting power");
        });
    });

    describe("Proposal Execution", function () {
        let proposalId;

        beforeEach(async function () {
            // Create a proposal
            const tx = await daoGovernance.connect(addr1).propose(
                "Test Proposal",
                "A test proposal for governance",
                "0x"
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProposalCreated');
            proposalId = event.args.proposalId;
        });

        it("Should allow execution of passed proposals", async function () {
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // Vote for the proposal
            await daoGovernance.connect(addr1).vote(proposalId, true);
            await daoGovernance.connect(addr2).vote(proposalId, true);
            
            // Fast forward past voting period
            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // 3 days
            await ethers.provider.send("evm_mine");
            
            // Execute proposal
            const tx = await daoGovernance.execute(proposalId);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ProposalExecuted');
            
            expect(event.args.proposalId).to.equal(proposalId);
        });

        it("Should not allow execution of failed proposals", async function () {
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // Vote against the proposal
            await daoGovernance.connect(addr1).vote(proposalId, false);
            await daoGovernance.connect(addr2).vote(proposalId, false);
            
            // Fast forward past voting period
            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // 3 days
            await ethers.provider.send("evm_mine");
            
            // Try to execute proposal
            await expect(
                daoGovernance.execute(proposalId)
            ).to.be.revertedWith("DAOGovernance: proposal not passed");
        });

        it("Should not allow execution before voting ends", async function () {
            // Fast forward to voting period
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
            await ethers.provider.send("evm_mine");
            
            // Try to execute before voting ends
            await expect(
                daoGovernance.execute(proposalId)
            ).to.be.revertedWith("DAOGovernance: voting not ended");
        });
    });

    describe("Delegation", function () {
        it("Should allow users to delegate their voting power", async function () {
            const tx = await daoGovernance.connect(addr2).delegate(addr3.address);
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'DelegateChanged');
            
            expect(event.args.delegator).to.equal(addr2.address);
            expect(event.args.toDelegate).to.equal(addr3.address);
        });

        it("Should not allow self-delegation", async function () {
            await expect(
                daoGovernance.connect(addr2).delegate(addr2.address)
            ).to.be.revertedWith("DAOGovernance: self-delegation not allowed");
        });

        it("Should update voting power after delegation", async function () {
            // Delegate addr2's voting power to addr3
            await daoGovernance.connect(addr2).delegate(addr3.address);
            
            // Check voting power
            const addr2Power = await daoGovernance.getVotingPower(addr2.address);
            const addr3Power = await daoGovernance.getVotingPower(addr3.address);
            
            expect(addr2Power).to.equal(0);
            expect(addr3Power).to.equal(ethers.utils.parseEther("1500000")); // 1M + 500K
        });
    });

    describe("Administrative Functions", function () {
        it("Should allow owner to update voting delay", async function () {
            const newDelay = 2 * 24 * 60 * 60; // 2 days
            await daoGovernance.updateVotingDelay(newDelay);
            
            expect(await daoGovernance.votingDelay()).to.equal(newDelay);
        });

        it("Should allow owner to update voting period", async function () {
            const newPeriod = 5 * 24 * 60 * 60; // 5 days
            await daoGovernance.updateVotingPeriod(newPeriod);
            
            expect(await daoGovernance.votingPeriod()).to.equal(newPeriod);
        });

        it("Should allow owner to update proposal threshold", async function () {
            const newThreshold = ethers.utils.parseEther("2000000"); // 2M tokens
            await daoGovernance.updateProposalThreshold(newThreshold);
            
            expect(await daoGovernance.proposalThreshold()).to.equal(newThreshold);
        });

        it("Should allow owner to update quorum threshold", async function () {
            const newThreshold = ethers.utils.parseEther("15000000"); // 15M tokens
            await daoGovernance.updateQuorumThreshold(newThreshold);
            
            expect(await daoGovernance.quorumThreshold()).to.equal(newThreshold);
        });

        it("Should not allow non-owner to update parameters", async function () {
            await expect(
                daoGovernance.connect(addr1).updateVotingDelay(86400)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
