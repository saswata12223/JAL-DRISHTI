import sys
import time
import tracemalloc
from pathlib import Path
import torch
import numpy as np

sys.path.append(str(Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\scripts\google_flood_forecasting").absolute()))

from googlehydrology.utils.config import Config
from googlehydrology.datasetzoo.multimet import Multimet, MultimetDataLoader
from googlehydrology.modelzoo import get_model
from torch.utils.data import DataLoader
from googlehydrology.evaluation.utils import BasinBatchSampler, get_samples_indexes
from googlehydrology.utils.cmal_deterministic import generate_predictions
from googlehydrology.datautils.scaler import Scaler

def main():
    import torch._dynamo
    torch._dynamo.config.suppress_errors = True
    torch.compiler.disable()
    
    device = torch.device('cpu')
    
    config_path = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\scripts\google_flood_forecasting\pretrained-models\google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs\config.yml")
    cfg = Config(config_path)
    
    cfg._cfg['run_dir'] = config_path.parent
    cfg._cfg['dynamics_data_dir'] = Path("gs://caravan-multimet/v1.1")
    cfg._cfg['statics_data_dir'] = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\scripts\google_flood_forecasting\tutorial\Caravan-nc")
    cfg._cfg['targets_data_dir'] = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\scripts\google_flood_forecasting\tutorial\Caravan-nc")
    cfg._cfg['use_compile'] = False
    
    if 'imerg' in cfg.forecast_inputs:
        del cfg.forecast_inputs['imerg']
    if 'cpc' in cfg.forecast_inputs:
        del cfg.forecast_inputs['cpc']
    
    scaler = Scaler(cfg.run_dir, calculate_scaler=False)
    
    basin = 'camels_04115265'
    
    dataset = Multimet(
        period='test',
        basins=[basin],
        cfg=cfg,
        is_train=False,
        compute_scaler=False
    )
    
    batch_sampler = BasinBatchSampler(
        sample_index=dataset._sample_index,
        batch_size=1,
        basins_indexes=get_samples_indexes([basin], samples=[basin]),
    )
    
    loader = MultimetDataLoader(
        dataset,
        lazy_load=False,
        batch_sampler=batch_sampler,
        num_workers=0,
        collate_fn=dataset.collate_fn,
        pin_memory=False,
        logging_level=30
    )
    
    model = get_model(cfg).to(device)
    model.eval()
    
    checkpoint = torch.load(cfg.run_dir / "model_epoch085.pt", map_location=device)
    model.load_state_dict(checkpoint)
    print("Model loaded successfully.")
    
    sample = next(iter(loader))
    
    for key in sample:
        if key.startswith('x_d'):
            sample[key] = {k: v.to(device) for k, v in sample[key].items()}
        elif not key.startswith('date'):
            sample[key] = sample[key].to(device)
            
    with torch.inference_mode():
        outputs = model(sample)
    
    print("\n--- RAW CMAL OUTPUT ---")
    print("Keys:", outputs.keys())
    for freq in ['']:
        if f'mu{freq}' in outputs:
            m = outputs[f'mu{freq}']
            b = outputs[f'b{freq}']
            t = outputs[f'tau{freq}']
            p = outputs[f'pi{freq}']
            break
    else:
        raise KeyError("Could not find mu in outputs")
        
    print(f"mu shape: {m.shape}")
    print(f"b shape: {b.shape}")
    print(f"tau shape: {t.shape}")
    print(f"pi shape: {p.shape}")
    
    seq_len = cfg.predict_last_n
    m = m[:, -seq_len:, :]
    b = b[:, -seq_len:, :]
    t = t[:, -seq_len:, :]
    p = p[:, -seq_len:, :]
        
    m_t = m[:, :, 0:cfg.n_distributions]
    b_t = b[:, :, 0:cfg.n_distributions]
    t_t = t[:, :, 0:cfg.n_distributions]
    p_t = p[:, :, 0:cfg.n_distributions]
    
    stats = generate_predictions(m_t, b_t, t_t, p_t)
    print(f"\nStats shape (mean + 9 quantiles): {stats.shape}")
    
    mean_scaled = stats[0, :, 0].numpy()
    p10_scaled = stats[0, :, 1].numpy()  
    p50_scaled = stats[0, :, 5].numpy()  
    p90_scaled = stats[0, :, 9].numpy()  
    
    center = 1.777243
    scale = 3.3809924
    
    mean_unscaled = mean_scaled * scale + center
    p10_unscaled = p10_scaled * scale + center
    p50_unscaled = p50_scaled * scale + center
    p90_unscaled = p90_scaled * scale + center
    
    print("\n--- EXPORTED DISCHARGE FORECAST (First 10 timesteps) ---")
    for i in range(10):
        print(f"Timestep {i+1}:")
        print(f"  P10 : {p10_unscaled[i]:.4f} m³/s")
        print(f"  P50 : {p50_unscaled[i]:.4f} m³/s")
        print(f"  Mean: {mean_unscaled[i]:.4f} m³/s")
        print(f"  P90 : {p90_unscaled[i]:.4f} m³/s")

if __name__ == "__main__":
    main()
