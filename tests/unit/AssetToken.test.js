const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetToken", function () {
    let assetToken;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        const AssetToken = await ethers.getContractFactory("AssetToken");
        assetToken = await AssetToken.deploy();
        await assetToken.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await assetToken.name()).to.equal("DeFi Asset Token");
            expect(await assetToken.symbol()).to.equal("DAT");
        });

        it("Should set the correct total supply", async function () {
            const totalSupply = await assetToken.totalSupply();
            expect(totalSupply).to.equal(ethers.utils.parseEther("1000000000")); // 1 billion tokens
        });

        it("Should set the owner as the initial owner", async function () {
            expect(await assetToken.owner()).to.equal(owner.address);
        });
    });

    describe("Minting", function () {
        it("Should allow owner to add minters", async function () {
            await assetToken.addMinter(addr1.address);
            expect(await assetToken.minters(addr1.address)).to.be.true;
        });

        it("Should allow minters to mint tokens", async function () {
            await assetToken.addMinter(addr1.address);
            const mintAmount = ethers.utils.parseEther("1000");
            
            await assetToken.connect(addr1).mint(addr2.address, mintAmount);
            expect(await assetToken.balanceOf(addr2.address)).to.equal(mintAmount);
        });

        it("Should not allow non-minters to mint", async function () {
            const mintAmount = ethers.utils.parseEther("1000");
            
            await expect(
                assetToken.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWith("AssetToken: caller is not a minter");
        });

        it("Should not allow minting beyond max supply", async function () {
            await assetToken.addMinter(addr1.address);
            const maxSupply = await assetToken.MAX_SUPPLY();
            const currentSupply = await assetToken.totalSupply();
            const excessAmount = maxSupply.sub(currentSupply).add(1);
            
            await expect(
                assetToken.connect(addr1).mint(addr2.address, excessAmount)
            ).to.be.revertedWith("AssetToken: mint amount exceeds max supply");
        });
    });

    describe("Blacklist", function () {
        it("Should allow owner to update blacklist", async function () {
            await assetToken.updateBlacklist(addr1.address, true);
            expect(await assetToken.blacklisted(addr1.address)).to.be.true;
        });

        it("Should prevent blacklisted addresses from transferring", async function () {
            await assetToken.updateBlacklist(addr1.address, true);
            const transferAmount = ethers.utils.parseEther("100");
            
            await expect(
                assetToken.connect(addr1).transfer(addr2.address, transferAmount)
            ).to.be.revertedWith("AssetToken: sender is blacklisted");
        });

        it("Should prevent transfers to blacklisted addresses", async function () {
            await assetToken.updateBlacklist(addr2.address, true);
            const transferAmount = ethers.utils.parseEther("100");
            
            await expect(
                assetToken.connect(addr1).transfer(addr2.address, transferAmount)
            ).to.be.revertedWith("AssetToken: recipient is blacklisted");
        });
    });

    describe("Pausable", function () {
        it("Should allow owner to pause and unpause", async function () {
            await assetToken.pause();
            expect(await assetToken.paused()).to.be.true;
            
            await assetToken.unpause();
            expect(await assetToken.paused()).to.be.false;
        });

        it("Should prevent transfers when paused", async function () {
            await assetToken.pause();
            const transferAmount = ethers.utils.parseEther("100");
            
            await expect(
                assetToken.connect(addr1).transfer(addr2.address, transferAmount)
            ).to.be.revertedWith("Pausable: paused");
        });
    });
});
