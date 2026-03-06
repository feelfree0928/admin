"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GlobalConfig {
  defaults: {
    timePerBet: {
      roulette: number;  // Single entry for all roulette types
      blackjack: number;
      baccarat: number;  // Single entry for all baccarat types
      slots: number;
      digits: number;
    };
    houseEdges: {
      european_roulette: number;
      american_roulette: number;
      french_roulette_standard: number;
      french_roulette_18s: number;
      blackjack: number;
      baccarat_player: number;
      baccarat_banker: number;
      baccarat_tie: number;
      slots: number;
      digits: number | null;
    };
    numSessions: number;
    baseProfit: {
      evPercent: number;
      hourlyRate: number;
    };
  };
  features: {
    preCoverplayEnabled: boolean;
    postCoverplayEnabled: boolean;
  };
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: GlobalConfig | null;
  onConfigUpdate: () => void;
}

export function SettingsModal({ open, onOpenChange, currentConfig, onConfigUpdate }: SettingsModalProps) {
  const [config, setConfig] = React.useState<GlobalConfig | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Initialize config when modal opens or currentConfig changes
  React.useEffect(() => {
    if (currentConfig) {
      setConfig(JSON.parse(JSON.stringify(currentConfig)));
    }
  }, [currentConfig, open]);

  const handleSaveClick = () => {
    setError(null);
    setPasswordError(null);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    if (!config) {
      setError("Configuration not loaded");
      return;
    }

    setSaving(true);
    setPasswordError(null);
    setError(null);

    try {
      const response = await fetch('http://5.78.132.169:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          config
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPassword("");
        setShowPasswordDialog(false);
        onOpenChange(false);
        onConfigUpdate();
        // Reload page to apply changes
        window.location.reload();
      } else {
        if (response.status === 401) {
          setPasswordError(data.error || "Invalid password");
        } else {
          setError(data.error || "Failed to save configuration");
          setShowPasswordDialog(false);
        }
      }
    } catch (err) {
      setError("Network error: Failed to save configuration");
      setShowPasswordDialog(false);
    } finally {
      setSaving(false);
    }
  };

  const updateTimePerBet = (game: keyof GlobalConfig['defaults']['timePerBet'], value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && config) {
      setConfig({
        ...config,
        defaults: {
          ...config.defaults,
          timePerBet: {
            ...config.defaults.timePerBet,
            [game]: numValue
          }
        }
      });
    }
  };

  const updateHouseEdge = (game: keyof GlobalConfig['defaults']['houseEdges'], value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && config) {
      setConfig({
        ...config,
        defaults: {
          ...config.defaults,
          houseEdges: {
            ...config.defaults.houseEdges,
            [game]: numValue
          }
        }
      });
    }
  };

  const updateNumSessions = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && config) {
      setConfig({
        ...config,
        defaults: {
          ...config.defaults,
          numSessions: numValue
        }
      });
    }
  };

  const updateFeature = (feature: keyof GlobalConfig['features'], value: boolean) => {
    if (config) {
      setConfig({
        ...config,
        features: {
          ...config.features,
          [feature]: value
        }
      });
    }
  };

  const updateBaseProfit = (field: keyof GlobalConfig['defaults']['baseProfit'], value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && config) {
      setConfig({
        ...config,
        defaults: {
          ...config.defaults,
          baseProfit: {
            ...config.defaults.baseProfit,
            [field]: numValue
          }
        }
      });
    }
  };

  if (!config) {
    return null;
  }

  return (
    <>
      <Dialog open={open && !showPasswordDialog} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Global Configuration</DialogTitle>
            <DialogDescription>
              Configure default values and features for all users. Changes require administrator password.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="timePerBet" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timePerBet">Time Per Bet</TabsTrigger>
              <TabsTrigger value="houseEdge">House Edge</TabsTrigger>
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="features">Coverplay</TabsTrigger>
            </TabsList>

            {/* Time Per Bet Tab */}
            <TabsContent value="timePerBet" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Time Per Bet</CardTitle>
                  <CardDescription>
                    Set default time per bet (in seconds) for each game category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Roulette */}
                  <div className="space-y-2">
                    <Label htmlFor="tpb-roulette">Roulette (All Types)</Label>
                    <Input
                      id="tpb-roulette"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={config.defaults.timePerBet.roulette}
                      onChange={(e) => updateTimePerBet('roulette', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Applies to all European, American, and French Roulette variants
                    </p>
                  </div>

                  {/* Blackjack */}
                  <div className="space-y-2">
                    <Label htmlFor="tpb-blackjack">Blackjack</Label>
                    <Input
                      id="tpb-blackjack"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={config.defaults.timePerBet.blackjack}
                      onChange={(e) => updateTimePerBet('blackjack', e.target.value)}
                    />
                  </div>

                  {/* Baccarat */}
                  <div className="space-y-2">
                    <Label htmlFor="tpb-baccarat">Baccarat (All Types)</Label>
                    <Input
                      id="tpb-baccarat"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={config.defaults.timePerBet.baccarat}
                      onChange={(e) => updateTimePerBet('baccarat', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Applies to Player, Banker, and Tie variants
                    </p>
                  </div>

                  {/* Slots */}
                  <div className="space-y-2">
                    <Label htmlFor="tpb-slots">Slots (All Risk Levels)</Label>
                    <Input
                      id="tpb-slots"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={config.defaults.timePerBet.slots}
                      onChange={(e) => updateTimePerBet('slots', e.target.value)}
                    />
                  </div>

                  {/* Digits */}
                  <div className="space-y-2">
                    <Label htmlFor="tpb-digits">Digits</Label>
                    <Input
                      id="tpb-digits"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={config.defaults.timePerBet.digits}
                      onChange={(e) => updateTimePerBet('digits', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* House Edge Tab */}
            <TabsContent value="houseEdge" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>House Edge</CardTitle>
                  <CardDescription>
                    Set default house edge percentages for each game type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Roulette */}
                  <div>
                    <h4 className="font-semibold mb-3">Roulette</h4>
                    <div className="space-y-4">
                      {/* European and American Roulette House Edge */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="he-european_roulette">European Roulette</Label>
                          <Input
                            id="he-european_roulette"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_roulette}
                            onChange={(e) => updateHouseEdge('european_roulette', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-american_roulette">American Roulette</Label>
                          <Input
                            id="he-american_roulette"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.american_roulette}
                            onChange={(e) => updateHouseEdge('american_roulette', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* French Roulette (Standard) and (18s) House Edge */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="he-french_roulette_standard">French Roulette (Standard)</Label>
                          <Input
                            id="he-french_roulette_standard"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.french_roulette_standard}
                            onChange={(e) => updateHouseEdge('french_roulette_standard', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-french_roulette_18s">French Roulette (18s)</Label>
                          <Input
                            id="he-french_roulette_18s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.french_roulette_18s}
                            onChange={(e) => updateHouseEdge('french_roulette_18s', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blackjack */}
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-3">Blackjack</h4>
                    <Input
                      id="he-blackjack"
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.defaults.houseEdges.blackjack}
                      onChange={(e) => updateHouseEdge('blackjack', e.target.value)}
                    />
                  </div>

                  {/* Baccarat */}
                  <div>
                    <h4 className="font-semibold mb-3">Baccarat</h4>
                    <div className="space-y-4">
                      {/* Baccarat Player and Banker House Edge */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_player">Baccarat Player</Label>
                          <Input
                            id="he-baccarat_player"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.baccarat_player}
                            onChange={(e) => updateHouseEdge('baccarat_player', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_banker">Baccarat Banker</Label>
                          <Input
                            id="he-baccarat_banker"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.baccarat_banker}
                            onChange={(e) => updateHouseEdge('baccarat_banker', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Baccarat Tie House Edge */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_tie">Baccarat Tie</Label>
                          <Input
                            id="he-baccarat_tie"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.baccarat_tie}
                            onChange={(e) => updateHouseEdge('baccarat_tie', e.target.value)}
                          />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </div>

                  {/* Slots */}
                  <div className="space-y-2">
                    <h4 className="font-semibold mb-3">Slots (All Risk Levels)</h4>
                    <Input
                      id="he-slots"
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.defaults.houseEdges.slots}
                      onChange={(e) => updateHouseEdge('slots', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Simulation Tab */}
            <TabsContent value="simulation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Parameters</CardTitle>
                  <CardDescription>
                    Set default simulation parameters for all users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="numSessions">Number of Sessions</Label>
                    <Input
                      id="numSessions"
                      type="number"
                      step="1000"
                      min="1000"
                      value={config.defaults.numSessions}
                      onChange={(e) => updateNumSessions(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values = more accurate results but slower. Recommended: 1,000,000 or higher.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base Profit Calculation</CardTitle>
                  <CardDescription>
                    Configure how Base Profit is calculated: max(EV × %, Hours × Hourly Rate)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="evPercent">EV Percentage (%)</Label>
                      <Input
                        id="evPercent"
                        type="number"
                        step="1"
                        min="0"
                        value={config.defaults.baseProfit?.evPercent ?? 10}
                        onChange={(e) => updateBaseProfit('evPercent', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentage of Expected Value (e.g., 10 = 10% of EV)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="1"
                        min="0"
                        value={config.defaults.baseProfit?.hourlyRate ?? 15}
                        onChange={(e) => updateBaseProfit('hourlyRate', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum hourly rate in dollars (e.g., 15 = $15/hour)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Anti-Detection Features</CardTitle>
                  <CardDescription>
                    Enable or disable coverplay features globally
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="preCoverplay"
                      checked={config.features.preCoverplayEnabled}
                      onCheckedChange={(checked) => updateFeature('preCoverplayEnabled', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="preCoverplay" className="cursor-pointer">
                        Enable Pre-Coverplay
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to configure betting before reaching wagering requirements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="postCoverplay"
                      checked={config.features.postCoverplayEnabled}
                      onCheckedChange={(checked) => updateFeature('postCoverplayEnabled', checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="postCoverplay" className="cursor-pointer">
                        Enable Post-Coverplay
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to configure betting after completing wagering requirements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={saving}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Administrator Authentication
            </DialogTitle>
            <DialogDescription>
              Enter the administrator password to save configuration changes.
            </DialogDescription>
          </DialogHeader>

          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !saving) {
                  handlePasswordSubmit();
                }
              }}
              disabled={saving}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPasswordDialog(false);
                setPassword("");
                setPasswordError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
