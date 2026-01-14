import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'config', 'global-settings.json');

export interface GlobalConfig {
  adminPassword: string;
  defaults: {
    timePerBet: {
      bj: number;
      european_1s: number;
      european_2s: number;
      european_3s: number;
      european_4s: number;
      european_6s: number;
      european_12s: number;
      european_18s: number;
      american_18s: number;
      french_18s: number;
      baccarat_player: number;
      baccarat_banker: number;
      baccarat_tie: number;
      slots: number;
      digits: number;
    };
    houseEdges: {
      bj: number;
      european_1s: number;
      european_2s: number;
      european_3s: number;
      european_4s: number;
      european_6s: number;
      european_12s: number;
      european_18s: number;
      american_18s: number;
      french_18s: number;
      baccarat_player: number;
      baccarat_banker: number;
      baccarat_tie: number;
      slots: number;
      digits: number | null;
    };
  };
  features: {
    preCoverplayEnabled: boolean;
    postCoverplayEnabled: boolean;
  };
}

// GET endpoint - Read configuration
export async function GET() {
  try {
    const fileContents = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const config: GlobalConfig = JSON.parse(fileContents);
    
    // Return config without password for security
    const { adminPassword, ...publicConfig } = config;
    
    return NextResponse.json({
      success: true,
      config: publicConfig
    });
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read configuration file' 
      },
      { status: 500 }
    );
  }
}

// POST endpoint - Update configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, config } = body;

    if (!password || !config) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password and config are required' 
        },
        { status: 400 }
      );
    }

    // Read current config to verify password
    const fileContents = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const currentConfig: GlobalConfig = JSON.parse(fileContents);

    // Verify password
    if (password !== currentConfig.adminPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid password' 
        },
        { status: 401 }
      );
    }

    // Merge new config with existing password
    const newConfig: GlobalConfig = {
      adminPassword: currentConfig.adminPassword,
      ...config
    };

    // Validate config structure
    if (!newConfig.defaults || !newConfig.defaults.timePerBet || typeof newConfig.defaults.timePerBet !== 'object' || !newConfig.defaults.houseEdges) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid configuration structure' 
        },
        { status: 400 }
      );
    }

    if (!newConfig.features || typeof newConfig.features.preCoverplayEnabled !== 'boolean' || typeof newConfig.features.postCoverplayEnabled !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid features configuration' 
        },
        { status: 400 }
      );
    }

    // Write updated config to file
    await fs.writeFile(
      CONFIG_FILE_PATH,
      JSON.stringify(newConfig, null, 2),
      'utf8'
    );

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update configuration file' 
      },
      { status: 500 }
    );
  }
}
