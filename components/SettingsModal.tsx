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
      const response = await fetch('/api/config', {
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

          <Tabs defaultValue="defaults" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="defaults">Game Defaults</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="defaults" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Game Defaults</CardTitle>
                  <CardDescription>
                    Set default time per bet and house edge percentages for each game type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Blackjack */}
                  <div>
                    <h4 className="font-semibold mb-3">Blackjack</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tpb-bj">Time Per Bet (seconds)</Label>
                        <Input
                          id="tpb-bj"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={config.defaults.timePerBet.bj}
                          onChange={(e) => updateTimePerBet('bj', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="he-bj">House Edge (%)</Label>
                        <Input
                          id="he-bj"
                          type="number"
                          step="0.01"
                          min="0"
                          value={config.defaults.houseEdges.bj}
                          onChange={(e) => updateHouseEdge('bj', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Roulette */}
                  <div>
                    <h4 className="font-semibold mb-3">Roulette</h4>
                    <div className="space-y-4">
                      {/* European 1s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_1s">Time Per Bet (seconds) - European 1s</Label>
                          <Input
                            id="tpb-european_1s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_1s}
                            onChange={(e) => updateTimePerBet('european_1s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_1s">House Edge (%) - European 1s</Label>
                          <Input
                            id="he-european_1s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_1s}
                            onChange={(e) => updateHouseEdge('european_1s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 2s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_2s">Time Per Bet (seconds) - European 2s</Label>
                          <Input
                            id="tpb-european_2s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_2s}
                            onChange={(e) => updateTimePerBet('european_2s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_2s">House Edge (%) - European 2s</Label>
                          <Input
                            id="he-european_2s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_2s}
                            onChange={(e) => updateHouseEdge('european_2s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 3s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_3s">Time Per Bet (seconds) - European 3s</Label>
                          <Input
                            id="tpb-european_3s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_3s}
                            onChange={(e) => updateTimePerBet('european_3s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_3s">House Edge (%) - European 3s</Label>
                          <Input
                            id="he-european_3s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_3s}
                            onChange={(e) => updateHouseEdge('european_3s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 4s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_4s">Time Per Bet (seconds) - European 4s</Label>
                          <Input
                            id="tpb-european_4s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_4s}
                            onChange={(e) => updateTimePerBet('european_4s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_4s">House Edge (%) - European 4s</Label>
                          <Input
                            id="he-european_4s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_4s}
                            onChange={(e) => updateHouseEdge('european_4s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 6s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_6s">Time Per Bet (seconds) - European 6s</Label>
                          <Input
                            id="tpb-european_6s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_6s}
                            onChange={(e) => updateTimePerBet('european_6s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_6s">House Edge (%) - European 6s</Label>
                          <Input
                            id="he-european_6s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_6s}
                            onChange={(e) => updateHouseEdge('european_6s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 12s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_12s">Time Per Bet (seconds) - European 12s</Label>
                          <Input
                            id="tpb-european_12s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_12s}
                            onChange={(e) => updateTimePerBet('european_12s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_12s">House Edge (%) - European 12s</Label>
                          <Input
                            id="he-european_12s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_12s}
                            onChange={(e) => updateHouseEdge('european_12s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* European 18s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-european_18s">Time Per Bet (seconds) - European 18s</Label>
                          <Input
                            id="tpb-european_18s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.european_18s}
                            onChange={(e) => updateTimePerBet('european_18s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-european_18s">House Edge (%) - European 18s</Label>
                          <Input
                            id="he-european_18s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.european_18s}
                            onChange={(e) => updateHouseEdge('european_18s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* American 18s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-american_18s">Time Per Bet (seconds) - American 18s</Label>
                          <Input
                            id="tpb-american_18s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.american_18s}
                            onChange={(e) => updateTimePerBet('american_18s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-american_18s">House Edge (%) - American 18s</Label>
                          <Input
                            id="he-american_18s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.american_18s}
                            onChange={(e) => updateHouseEdge('american_18s', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* French 18s */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-french_18s">Time Per Bet (seconds) - French 18s</Label>
                          <Input
                            id="tpb-french_18s"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.french_18s}
                            onChange={(e) => updateTimePerBet('french_18s', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-french_18s">House Edge (%) - French 18s</Label>
                          <Input
                            id="he-french_18s"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.french_18s}
                            onChange={(e) => updateHouseEdge('french_18s', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Baccarat */}
                  <div>
                    <h4 className="font-semibold mb-3">Baccarat</h4>
                    <div className="space-y-4">
                      {/* Baccarat Player */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-baccarat_player">Time Per Bet (seconds) - Baccarat Player</Label>
                          <Input
                            id="tpb-baccarat_player"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.baccarat_player}
                            onChange={(e) => updateTimePerBet('baccarat_player', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_player">House Edge (%) - Baccarat Player</Label>
                          <Input
                            id="he-baccarat_player"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.baccarat_player}
                            onChange={(e) => updateHouseEdge('baccarat_player', e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Baccarat Banker */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-baccarat_banker">Time Per Bet (seconds) - Baccarat Banker</Label>
                          <Input
                            id="tpb-baccarat_banker"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.baccarat_banker}
                            onChange={(e) => updateTimePerBet('baccarat_banker', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_banker">House Edge (%) - Baccarat Banker</Label>
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
                      {/* Baccarat Tie */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tpb-baccarat_tie">Time Per Bet (seconds) - Baccarat Tie</Label>
                          <Input
                            id="tpb-baccarat_tie"
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={config.defaults.timePerBet.baccarat_tie}
                            onChange={(e) => updateTimePerBet('baccarat_tie', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="he-baccarat_tie">House Edge (%) - Baccarat Tie</Label>
                          <Input
                            id="he-baccarat_tie"
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.defaults.houseEdges.baccarat_tie}
                            onChange={(e) => updateHouseEdge('baccarat_tie', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slots */}
                  <div>
                    <h4 className="font-semibold mb-3">Slots</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tpb-slots">Time Per Bet (seconds) - Slots (all risk levels)</Label>
                        <Input
                          id="tpb-slots"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={config.defaults.timePerBet.slots}
                          onChange={(e) => updateTimePerBet('slots', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="he-slots">House Edge (%) - Slots (all risk levels)</Label>
                        <Input
                          id="he-slots"
                          type="number"
                          step="0.01"
                          min="0"
                          value={config.defaults.houseEdges.slots}
                          onChange={(e) => updateHouseEdge('slots', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Digits */}
                  <div>
                    <h4 className="font-semibold mb-3">Digits</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tpb-digits">Time Per Bet (seconds) - Digits</Label>
                        <Input
                          id="tpb-digits"
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={config.defaults.timePerBet.digits}
                          onChange={(e) => updateTimePerBet('digits', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="he-digits">House Edge (%) - Digits</Label>
                        <Input
                          id="he-digits"
                          type="text"
                          value="Variable based on threshold"
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          House edge for Digits is calculated dynamically based on the selected threshold
                        </p>
                      </div>
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
