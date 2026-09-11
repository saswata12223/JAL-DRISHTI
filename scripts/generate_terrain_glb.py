import os
import numpy as np
import trimesh

def generate_terrain_glb():
    output_path = r"c:\JAL DRISTI\frontend\public\models\jal-drishti-terrain.glb"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Create high-resolution 250x250 Himalayan Valley topography grid
    rows, cols = 250, 250
    x = np.linspace(-60, 60, cols)
    y = np.linspace(-60, 60, rows)
    xx, yy = np.meshgrid(x, y)
    
    # Himalayan mountain ridges + steep central river valley (Alaknanda river trough)
    distance_from_river = np.abs(xx - 12 * np.sin(yy / 14.0))
    valley_trough = np.clip(distance_from_river / 16.0, 0, 1)
    
    # Multi-octave mountain ridges (synthesizing SRTM steep slope profile)
    ridge_primary = (np.sin(xx / 8.0) * np.cos(yy / 8.0) + np.sin(xx / 4.0) * 0.4) * 22.0
    ridge_secondary = (np.cos(xx / 3.0 + 1.2) * np.sin(yy / 5.0) + np.cos(yy / 2.0) * 0.25) * 8.0
    
    z = (ridge_primary + ridge_secondary + 25.0) * valley_trough - np.exp(-distance_from_river / 3.5) * 10.0

    x_coords = np.linspace(-70, 70, cols)
    y_coords = np.linspace(-70, 70, rows)
    xx_coords, yy_coords = np.meshgrid(x_coords, y_coords)

    # Flatten coordinates into 3D vertices (X, Z height, Y depth)
    vertices = np.column_stack((xx_coords.flatten(), z.flatten(), yy_coords.flatten()))

    # Build triangle faces
    faces = []
    for r in range(rows - 1):
        for c in range(cols - 1):
            i0 = r * cols + c
            i1 = i0 + 1
            i2 = (r + 1) * cols + c
            i3 = i2 + 1
            faces.append([i0, i2, i1])
            faces.append([i1, i2, i3])

    faces = np.array(faces)

    # Compute vertex colors based on elevation (River valley teal, saturated slopes, mountain rock, snow peak)
    colors = np.zeros((len(vertices), 4), dtype=np.uint8)
    min_z, max_z = np.min(vertices[:, 1]), np.max(vertices[:, 1])
    normalized_z = (vertices[:, 1] - min_z) / (max_z - min_z + 1e-5)

    for idx, elevation in enumerate(normalized_z):
        if elevation < 0.12:
            # River channel bed (Deep ocean teal)
            colors[idx] = [12, 55, 50, 255]
        elif elevation < 0.50:
            # Riparian valley vegetation (Deep forest teal)
            colors[idx] = [18, 90, 75, 255]
        elif elevation < 0.80:
            # High Himalayan rock ridge (Slate teal-grey)
            colors[idx] = [55, 105, 100, 255]
        else:
            # Glacier / Snow peaks (Glacial white-teal tint)
            colors[idx] = [215, 245, 240, 255]

    # Create Trimesh object
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, vertex_colors=colors)
    mesh.export(output_path, file_type='glb')
    print(f"Successfully exported 3D GLB terrain model to {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == "__main__":
    generate_terrain_glb()
