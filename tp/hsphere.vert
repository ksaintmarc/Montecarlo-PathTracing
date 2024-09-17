vec3 sample_hemisphere(in float roughness)
{

	// Algo echna:
	// Z <- rand
	// beta <- Z : angle/plan_xy
	// alpha <- rand
	// x,y,z <- alpha,beta : coord polaire -> cartesienne

    float alpha = roughness * roughness;


    float beta = 2.0 * PI * random_float();

    float tanTheta2 = -alpha * alpha * log(1.0 - random_float());
    float cosTheta = 1.0 / sqrt(1.0 + tanTheta2);
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta * cosTheta));

    vec3 localDir = vec3(cos(beta) * sinTheta, sin(beta) * sinTheta, cosTheta);

    return normalize(localDir);
}

vec3 random_ray(in vec3 D, in float roughness)
{
	// Algo orientation échantillon
	// choisir un W normalisé non colineaire à D
	// U orthogonal à D et W
	// V tq U,V,D repère ortho-normé direct
	// mettre  U,V,D dans une  matrice 3x3 de changement de repère M
	// multiplier votre echantillon par M pour bien l'orienter
	// ici par de matrice 4x4 car pas de translation

	vec3 W = normalize(vec3(D.x,D.y+5.0,D.z+3.0));
	vec3 U = normalize(cross(D,W));
	vec3 V = normalize(cross(D,U));

	mat3 M = mat3(U,V,D);

	return normalize(M * sample_hemisphere(roughness));
}

void main()
{
	// param de srand le nombre de random_float appelé dans le shader
	srand(3u);
	vec3 P = random_ray(normalize(normal), 1.0);
	gl_Position = pvMatrix * vec4(P,1);
}