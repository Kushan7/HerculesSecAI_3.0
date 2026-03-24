#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import Table from 'cli-table3';
import fs from 'fs';

const program = new Command();

program
  .name('herculessec')
  .description('HerculesSec Pro Vibe-Coding Vulnerability Scanner CLI')
  .version('1.0.0');

program.command('scan')
  .description('Scan the current vibe-coding workspace for vulnerabilities')
  .option('-t, --target <url>', 'Target URL or GitHub repository string')
  .action(async (options) => {
    console.log(chalk.bold.hex('#a855f7')('\n🛡️  HerculesSec Pro - Initializing Deep Threat Scan...\n'));
    
    let target = options.target;
    if (!target) {
        if (fs.existsSync('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            target = pkg.name || 'local-vibe-project';
            console.log(chalk.dim(`Detected local vibe-environment schema: ${chalk.white(target)}`));
            console.log(chalk.dim(`Extracting ${Object.keys(pkg.dependencies || {}).length} immediate dependencies for OSV analysis.\n`));
        } else {
            target = 'local-vibe-project';
        }
    }

    const spinner = ora('Engaging AI Dual-Layer Scanning Engine & Intelligence Plugins...').start();

    try {
        const API_URL = process.env.HERCULES_API || 'http://localhost:8000/api/scan';
        const initRes = await axios.post(API_URL, { target_url: target });
        const scanId = initRes.data.scan_id;
        
        spinner.text = `Scan submitted successfully (ID: ${scanId}). Polling LLM Red Team reflection...`;
        
        let result = null;
        for (let i = 0; i < 7; i++) {
            await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
            const pollRes = await axios.get(`${API_URL}/${scanId}`);
            if (pollRes.data.status === 'completed' || pollRes.data.status === 'failed') {
                result = pollRes.data;
                break;
            }
        }
        
        if (!result || result.status !== 'completed') {
            spinner.fail(chalk.red('AI Red Team reflection timed out or failed logic constraints.'));
            process.exit(1);
        }
        
        spinner.succeed(chalk.green('Dual-Layer Scan Finalized successfully!\n'));
        
        const riskColor = result.overall_risk_level === 'Critical' ? chalk.bgRed.white : 
                          result.overall_risk_level === 'High' ? chalk.red : 
                          result.overall_risk_level === 'Medium' ? chalk.keyword('orange') : chalk.green;
                          
        console.log(chalk.bold(`Overall Risk Profile: `) + riskColor(` ${result.overall_risk_level} `) + chalk.bold(` (Score: ${result.risk_score}/100)`));
        console.log(chalk.dim(`Threat Intelligence Duration: ${result.scan_duration} | Analytic Vectors Executed: ${result.tests_performed}\n`));

        if (result.vulnerabilities.length === 0) {
            console.log(chalk.green.bold('✅ Complete codebase integrity validated. No vulnerabilities detected.\n'));
            process.exit(0);
        }

        console.log(chalk.bold.red(`Identified ${result.vulnerabilities.length} Critical Vectors:\n`));
        
        const table = new Table({
            head: [chalk.cyan('CVE / ID'), chalk.cyan('Severity'), chalk.cyan('CVSS'), chalk.cyan('Vulnerability'), chalk.cyan('CWE Label')],
            wordWrap: true,
            colWidths: [22, 12, 8, 40, 16]
        });

        result.vulnerabilities.forEach(v => {
            const sevColor = v.severity === 'Critical' ? chalk.bgRed.white : v.severity === 'High' ? chalk.red : chalk.yellow;
            table.push([
                v.id,
                sevColor(` ${v.severity} `),
                v.cvss_score.toString(),
                v.title,
                v.cwe || 'Unknown'
            ]);
        });

        console.log(table.toString());
        console.log(chalk.dim('\nDetailed Proof of Concepts and AI Auto-Remediation blocks are available in the Web Dashboard or via --verbose CLI flags.\n'));
        
    } catch (e) {
        spinner.fail(chalk.red('Connection to HerculesSec Pro Engine failed. Ensure the FastAPI backend is running!'));
        console.error(chalk.dim(e.message));
    }
  });

program.parse();
